import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import bcrypt from 'bcrypt';
import request from 'supertest';

import { createApp } from './index.js';
import { pool } from './db.js';
import { getLogLines } from './logger.js';
import { resetLoginRateLimit } from './rate-limit.js';

type MockRow = Record<string, unknown>;
type QueryResult = { rows: MockRow[]; rowCount: number };

const COMPANY_ID = 'company-1';
const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';
const PASSWORD = 'Senha123!';

let userPasswordHash = '';

const originalQuery = pool.query.bind(pool);

function result(rows: MockRow[] = []): QueryResult {
  return { rows, rowCount: rows.length };
}

function normalizeSql(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

type MockState = {
  users: Array<{ id: string; email: string; encrypted_password: string; raw_user_meta_data: { full_name: string } }>;
  profiles: Array<{ id: string; company_id: string | null }>;
  companies: Array<{ id: string; name: string }>;
  roles: Array<{ user_id: string; role: string; company_id: string | null }>;
  clients: Array<{ id: string; name: string; email: string | null; phone: string | null; address: string | null; created_at: string }>;
  pets: Array<{ id: string; client_id: string; name: string; species: string; breed: string | null; birth_date: string | null; created_at: string }>;
  services: Array<{ id: string; name: string }>;
  appointments: Array<{ id: string; client_id: string; pet_id: string; service_id: string; scheduled_at: string; duration_minutes: number; status: string; vet_name: string | null }>;
};

function createState(): MockState {
  return {
    users: [
      {
        id: USER_ID,
        email: 'user@test.local',
        encrypted_password: userPasswordHash,
        raw_user_meta_data: { full_name: 'Usuario Teste' },
      },
      {
        id: ADMIN_ID,
        email: 'admin@test.local',
        encrypted_password: userPasswordHash,
        raw_user_meta_data: { full_name: 'Admin Teste' },
      },
    ],
    profiles: [
      { id: USER_ID, company_id: COMPANY_ID },
      { id: ADMIN_ID, company_id: COMPANY_ID },
    ],
    companies: [{ id: COMPANY_ID, name: 'Pet Pro Test' }],
    roles: [{ user_id: ADMIN_ID, role: 'admin', company_id: COMPANY_ID }],
    clients: [
      {
        id: 'client-1',
        name: 'Maria',
        email: 'maria@test.local',
        phone: '11999999999',
        address: null,
        created_at: new Date('2026-01-01T10:00:00.000Z').toISOString(),
      },
    ],
    pets: [
      {
        id: 'pet-1',
        client_id: 'client-1',
        name: 'Rex',
        species: 'Cão',
        breed: 'Vira-lata',
        birth_date: null,
        created_at: new Date('2026-01-01T10:00:00.000Z').toISOString(),
      },
    ],
    services: [{ id: 'service-1', name: 'Consulta' }],
    appointments: [],
  };
}

function installMockQuery(state: MockState) {
  (pool as unknown as { query: (sql: string, params?: unknown[]) => Promise<QueryResult> }).query = async (
    sqlText: string,
    params: unknown[] = [],
  ): Promise<QueryResult> => {
    const sql = normalizeSql(sqlText);

    if (sql.includes('from auth.users where lower(email) = $1')) {
      const email = String(params[0] ?? '');
      const user = state.users.find((u) => u.email.toLowerCase() === email);
      return result(user ? [user] : []);
    }

    if (sql.includes('from public.profiles where id = $1')) {
      const id = String(params[0] ?? '');
      const profile = state.profiles.find((p) => p.id === id);
      return result(profile ? [{ company_id: profile.company_id }] : []);
    }

    if (sql.includes('from public.companies where id = $1')) {
      const id = String(params[0] ?? '');
      const company = state.companies.find((c) => c.id === id);
      return result(company ? [company] : []);
    }

    if (sql.includes("from public.user_roles where user_id = $1 and role = 'superadmin'")) {
      const userId = String(params[0] ?? '');
      const isSuperAdmin = state.roles.some((r) => r.user_id === userId && r.role === 'superadmin');
      return result(isSuperAdmin ? [{ exists: 1 }] : []);
    }

    if (sql.includes("from public.user_roles where user_id = $1 and company_id = $2 and role in ('admin', 'superadmin')")) {
      const userId = String(params[0] ?? '');
      const companyId = String(params[1] ?? '');
      const isAdmin = state.roles.some(
        (r) => r.user_id === userId && r.company_id === companyId && (r.role === 'admin' || r.role === 'superadmin'),
      );
      return result(isAdmin ? [{ exists: 1 }] : []);
    }

    if (sql.includes('select c.id, c.name, c.email, c.phone, c.address, c.created_at')) {
      const rows = state.clients.map((c) => ({
        ...c,
        pets_count: state.pets.filter((p) => p.client_id === c.id).length,
      }));
      return result(rows);
    }

    if (sql.startsWith('select id from public.clients where id = $1 and company_id = $2')) {
      const id = String(params[0] ?? '');
      return result(state.clients.some((c) => c.id === id) ? [{ id }] : []);
    }

    if (sql.startsWith('insert into public.pets')) {
      const [companyId, clientId, name, species, breed, birthDate] = params as [string, string, string, string, string | null, string | null];
      const id = `pet-${state.pets.length + 1}`;
      const created_at = new Date().toISOString();
      const pet = {
        id,
        client_id: clientId,
        name,
        species,
        breed,
        birth_date: birthDate,
        created_at,
      };
      void companyId;
      state.pets.push(pet);
      return result([{ id, name, species, breed, birth_date: birthDate, created_at }]);
    }

    if (sql.startsWith('select name from public.clients where id = $1')) {
      const clientId = String(params[0] ?? '');
      const client = state.clients.find((c) => c.id === clientId);
      return result(client ? [{ name: client.name }] : []);
    }

    if (sql.startsWith('select id from public.pets where id = $1 and company_id = $2')) {
      const id = String(params[0] ?? '');
      return result(state.pets.some((p) => p.id === id) ? [{ id }] : []);
    }

    if (sql.startsWith('select id from public.services where id = $1 and company_id = $2')) {
      const id = String(params[0] ?? '');
      return result(state.services.some((s) => s.id === id) ? [{ id }] : []);
    }

    if (sql.startsWith('select client_id from public.pets where id = $1')) {
      const petId = String(params[0] ?? '');
      const pet = state.pets.find((p) => p.id === petId);
      return result(pet ? [{ client_id: pet.client_id }] : []);
    }

    if (sql.startsWith('insert into public.appointments')) {
      const [, clientId, petId, serviceId, scheduledAt, durationMinutes, status, vetName] = params as [
        string,
        string,
        string,
        string,
        string,
        number,
        string,
        string | null,
      ];
      const id = `apt-${state.appointments.length + 1}`;
      const appointment = {
        id,
        client_id: clientId,
        pet_id: petId,
        service_id: serviceId,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        status,
        vet_name: vetName,
      };
      state.appointments.push(appointment);
      return result([
        {
          id,
          scheduled_at: scheduledAt,
          duration_minutes: durationMinutes,
          status,
          vet_name: vetName,
        },
      ]);
    }

    if (sql.includes('select c.name as client_name, p.name as pet_name, p.species as pet_species, s.name as service_name')) {
      const petId = String(params[0] ?? '');
      const serviceId = String(params[1] ?? '');
      const clientId = String(params[2] ?? '');
      const client = state.clients.find((c) => c.id === clientId);
      const pet = state.pets.find((p) => p.id === petId);
      const service = state.services.find((s) => s.id === serviceId);
      if (!client || !pet || !service) return result([]);
      return result([
        {
          client_name: client.name,
          pet_name: pet.name,
          pet_species: pet.species,
          service_name: service.name,
        },
      ]);
    }

    throw new Error(`SQL não mockado no teste: ${sql}`);
  };
}

beforeEach(async () => {
  userPasswordHash = await bcrypt.hash(PASSWORD, 4);
  installMockQuery(createState());
  resetLoginRateLimit();
});

afterEach(() => {
  (pool as unknown as { query: typeof pool.query }).query = originalQuery;
  resetLoginRateLimit();
});

test('POST /auth/login autentica com sucesso', async () => {
  const app = createApp();
  const res = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: PASSWORD,
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'user@test.local');
  assert.ok(res.body.token);
});

test('POST /auth/login aplica rate limit após várias tentativas', async () => {
  const app = createApp();

  for (let i = 0; i < 10; i += 1) {
    const attempt = await request(app).post('/auth/login').send({
      email: 'user@test.local',
      password: 'senha-invalida',
    });
    assert.equal(attempt.status, 401);
  }

  const blocked = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: 'senha-invalida',
  });

  assert.equal(blocked.status, 429);
  assert.match(String(blocked.body.error), /Muitas tentativas de login/);
});

test('GET /api/logs exige autenticação e admin', async () => {
  const app = createApp();

  const unauth = await request(app).get('/api/logs');
  assert.equal(unauth.status, 401);

  const userLogin = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: PASSWORD,
  });
  assert.equal(userLogin.status, 200);

  const forbidden = await request(app)
    .get('/api/logs')
    .set('Authorization', `Bearer ${userLogin.body.token}`);
  assert.equal(forbidden.status, 403);

  const adminLogin = await request(app).post('/auth/login').send({
    email: 'admin@test.local',
    password: PASSWORD,
  });
  assert.equal(adminLogin.status, 200);

  const allowed = await request(app)
    .get('/api/logs')
    .set('Authorization', `Bearer ${adminLogin.body.token}`);
  assert.equal(allowed.status, 200);
  assert.ok(Array.isArray(allowed.body.logs));
  assert.ok(getLogLines().length > 0);
});

test('GET /api/clients retorna lista para usuário autenticado', async () => {
  const app = createApp();
  const login = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: PASSWORD,
  });

  const res = await request(app)
    .get('/api/clients')
    .set('Authorization', `Bearer ${login.body.token}`);

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body[0].name, 'Maria');
});

test('POST /api/pets cria pet com sucesso', async () => {
  const app = createApp();
  const login = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: PASSWORD,
  });

  const res = await request(app)
    .post('/api/pets')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      client_id: 'client-1',
      name: 'Mimi',
      species: 'Gato',
      breed: 'Siamês',
      birth_date: '2024-01-20',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.name, 'Mimi');
  assert.equal(res.body.owner, 'Maria');
});

test('POST /api/pets retorna erro padronizado de validação', async () => {
  const app = createApp();
  const login = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: PASSWORD,
  });

  const res = await request(app)
    .post('/api/pets')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      client_id: 'client-1',
      name: '',
      species: 'Gato',
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
  assert.equal(res.body.field, 'name');
});

test('POST /api/appointments cria agendamento válido', async () => {
  const app = createApp();
  const login = await request(app).post('/auth/login').send({
    email: 'user@test.local',
    password: PASSWORD,
  });

  const res = await request(app)
    .post('/api/appointments')
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({
      client_id: 'client-1',
      pet_id: 'pet-1',
      service_id: 'service-1',
      scheduled_at: '2026-02-11T10:00:00.000Z',
      duration_minutes: 30,
      status: 'scheduled',
      vet_name: 'Dr. Teste',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.client, 'Maria');
  assert.equal(res.body.service, 'Consulta');
});
