/**
 * Rotas de API multi-tenant (SaaS).
 * REGRA: Todas as consultas de dados (clientes, pets, agendamentos, etc.) DEVEM filtrar
 * por company_id = req.companyId (do profile do usuário autenticado). Nunca retornar
 * dados de outra empresa.
 */
import { Response } from 'express';
import { pool } from '../db.js';
import type { AuthReq } from '../middleware.js';
import { parseWithSchema, sendError } from '../http-error.js';
import { assertPlanLimit, assertPlanModuleAccess } from '../plan-access.js';
import {
  appointmentPaymentPayloadSchema,
  appointmentPayloadSchema,
  appearanceSettingsSchema,
  cashEntryPayloadSchema,
  clientPayloadSchema,
  companyPayloadSchema,
  companySettingsSchema,
  companyUserRoleSchema,
  reminderProcessPayloadSchema,
  notificationSettingsSchema,
  planPayloadSchema,
  productPayloadSchema,
  securitySettingsSchema,
  servicePayloadSchema,
  transactionPayloadSchema,
  medicalRecordPayloadSchema,
  petPayloadSchema,
} from '../validation.js';
import { writeAuditLog } from '../audit.js';

const companyId = (req: AuthReq) => req.companyId;
const toNull = (value?: string | null) => {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

function formatPetAge(birthDateValue: string | Date): string {
  const birthDate = new Date(birthDateValue);
  if (Number.isNaN(birthDate.getTime())) return '';

  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();

  if (now.getDate() < birthDate.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;

  const totalMonths = Math.max(0, years * 12 + months);
  return `${totalMonths} ${totalMonths === 1 ? 'mês' : 'meses'}`;
}

function listParams(req: AuthReq) {
  const pageRaw = Number(req.query.page ?? 1);
  const limitRaw = Number(req.query.limit ?? 20);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 20;
  const offset = (page - 1) * limit;
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
  return { page, limit, offset, q, order };
}

const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;
const REMINDER_MIN_DELAY_MS = 60 * 1000;

function resolveReminderDate(scheduledAt: string): Date {
  const base = new Date(scheduledAt);
  if (Number.isNaN(base.getTime())) return new Date(Date.now() + REMINDER_MIN_DELAY_MS);
  const reminderAt = new Date(base.getTime() - REMINDER_LEAD_MS);
  const minAllowed = new Date(Date.now() + REMINDER_MIN_DELAY_MS);
  return reminderAt > minAllowed ? reminderAt : minAllowed;
}

async function remindersEnabled(companyIdVal: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT reminders FROM public.notification_settings WHERE company_id = $1`,
    [companyIdVal]
  );
  if (!rows[0]) return true;
  return rows[0].reminders !== false;
}

async function cancelAppointmentReminders(companyIdVal: string, appointmentId: string, reason?: string) {
  await pool.query(
    `UPDATE public.reminder_jobs
     SET status = 'cancelled',
         error_message = COALESCE($3, error_message)
     WHERE company_id = $1
       AND appointment_id = $2
       AND status = 'pending'`,
    [companyIdVal, appointmentId, reason ?? null]
  );
}

async function syncAppointmentReminder(input: {
  companyId: string;
  appointmentId: string;
  clientId: string;
  petId: string;
  scheduledAt: string;
  status: string;
}) {
  try {
    const enabled = await remindersEnabled(input.companyId);
    const inactiveStatus = input.status === 'cancelled' || input.status === 'completed';
    if (!enabled || inactiveStatus) {
      await cancelAppointmentReminders(input.companyId, input.appointmentId, enabled ? 'Agendamento encerrado.' : 'Lembretes desativados.');
      return;
    }

    const scheduledFor = resolveReminderDate(input.scheduledAt);
    const payload = {
      appointment_id: input.appointmentId,
      client_id: input.clientId,
      pet_id: input.petId,
      scheduled_at: input.scheduledAt,
      template: 'appointment_reminder_v1',
    };

    const { rows } = await pool.query(
      `WITH latest AS (
         SELECT id
         FROM public.reminder_jobs
         WHERE company_id = $1
           AND appointment_id = $2
           AND reminder_type = 'appointment'
         ORDER BY created_at DESC
         LIMIT 1
       )
       UPDATE public.reminder_jobs r
       SET client_id = $3,
           pet_id = $4,
           scheduled_for = $5,
           channel = 'whatsapp',
           status = 'pending',
           sent_at = NULL,
           error_message = NULL,
           payload = $6::jsonb
       FROM latest
       WHERE r.id = latest.id
       RETURNING r.id`,
      [input.companyId, input.appointmentId, input.clientId, input.petId, scheduledFor.toISOString(), JSON.stringify(payload)]
    );

    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO public.reminder_jobs
          (company_id, appointment_id, client_id, pet_id, reminder_type, channel, scheduled_for, status, payload)
         VALUES ($1, $2, $3, $4, 'appointment', 'whatsapp', $5, 'pending', $6::jsonb)`,
        [input.companyId, input.appointmentId, input.clientId, input.petId, scheduledFor.toISOString(), JSON.stringify(payload)]
      );
    }
  } catch (e) {
    // Reminder nunca deve bloquear fluxo de agendamento.
    console.warn('syncAppointmentReminder:', e);
  }
}

function toDateOnly(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export async function dashboardStats(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) {
      return res.json({ stats: [], upcomingAppointments: [], lowStockItems: [] });
    }

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

    const [clientsCount, appointmentsToday, appointmentsList, lowStock, revenues] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM public.clients WHERE company_id = $1', [cid]),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM public.appointments WHERE company_id = $1 AND scheduled_at::date = $2`,
        [cid, today]
      ),
      pool.query(
        `SELECT a.scheduled_at, c.name AS client_name, p.name AS pet_name, s.name AS service_name
         FROM public.appointments a
         JOIN public.clients c ON c.id = a.client_id
         JOIN public.pets p ON p.id = a.pet_id
         JOIN public.services s ON s.id = a.service_id
         WHERE a.company_id = $1 AND a.scheduled_at::date = $2 AND a.status != 'cancelled'
         ORDER BY a.scheduled_at LIMIT 8`,
        [cid, today]
      ),
      pool.query(
        `SELECT name, stock, min_stock FROM public.products WHERE company_id = $1 AND stock <= min_stock LIMIT 5`,
        [cid]
      ),
      pool.query(
        `SELECT COALESCE(SUM(value),0)::float AS total FROM public.transactions WHERE company_id = $1 AND type = 'revenue' AND date >= $2`,
        [cid, new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)]
      ),
    ]);

    const stats = [
      { title: 'Consultas Hoje', value: String(appointmentsToday.rows[0]?.c ?? 0), change: '', icon: 'Calendar' },
      { title: 'Clientes Ativos', value: String(clientsCount.rows[0]?.c ?? 0), change: '', icon: 'Users' },
      { title: 'Faturamento Mensal', value: `R$ ${Number(revenues.rows[0]?.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '', icon: 'DollarSign' },
      { title: 'Estoque Baixo', value: String(lowStock.rows.length), change: '', icon: 'Package' },
    ];

    const upcomingAppointments = (appointmentsList.rows || []).map((r: { scheduled_at: string; client_name: string; pet_name: string; service_name: string }) => ({
      time: new Date(r.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      client: r.client_name,
      pet: r.pet_name,
      service: r.service_name,
    }));

    const lowStockItems = (lowStock.rows || []).map((r: { name: string; stock: number; min_stock: number }) => ({
      name: r.name,
      quantity: r.stock,
      min: r.min_stock,
    }));

    res.json({ stats, upcomingAppointments, lowStockItems });
  } catch (e) {
    console.error('dashboardStats:', e);
    res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
}

export async function getClients(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) return res.json([]);
    const { limit, offset, q, order } = listParams(req);
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.address, c.created_at,
        (SELECT COUNT(*)::int FROM public.pets WHERE client_id = c.id) AS pets_count
       FROM public.clients c
       WHERE c.company_id = $1
         AND ($2 = '' OR c.name ILIKE '%' || $2 || '%' OR COALESCE(c.email, '') ILIKE '%' || $2 || '%')
       ORDER BY c.name ${order}
       LIMIT $3 OFFSET $4`,
      [cid, q, limit, offset]
    );
    const clients = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      pets: r.pets_count ?? 0,
      lastVisit: r.created_at,
      status: 'active',
    }));
    res.json(clients);
  } catch (e) {
    console.error('getClients:', e);
    res.status(500).json({ error: 'Erro ao listar clientes.' });
  }
}

export async function getPets(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) return res.json([]);
    const { limit, offset, q, order } = listParams(req);
    const { rows } = await pool.query(
      `SELECT p.id, p.client_id, p.name, p.species, p.breed, p.birth_date, c.name AS owner_name, p.created_at
       FROM public.pets p
       JOIN public.clients c ON c.id = p.client_id
       WHERE p.company_id = $1
         AND ($2 = '' OR p.name ILIKE '%' || $2 || '%' OR c.name ILIKE '%' || $2 || '%')
       ORDER BY p.name ${order}
       LIMIT $3 OFFSET $4`,
      [cid, q, limit, offset]
    );
    const pets = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      client_id: r.client_id,
      name: r.name,
      species: r.species,
      breed: r.breed ?? '',
      birth_date: r.birth_date ?? null,
      age: r.birth_date ? formatPetAge(r.birth_date as string) : '',
      owner: r.owner_name,
      lastVisit: r.created_at,
      status: 'healthy',
    }));
    res.json(pets);
  } catch (e) {
    console.error('getPets:', e);
    res.status(500).json({ error: 'Erro ao listar pets.' });
  }
}

export async function getServices(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) return res.json([]);
    const { limit, offset, q, order } = listParams(req);
    const { rows } = await pool.query(
      `SELECT id, name, category, duration_minutes, price, commission_pct
       FROM public.services
       WHERE company_id = $1
         AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR category ILIKE '%' || $2 || '%')
       ORDER BY name ${order}
       LIMIT $3 OFFSET $4`,
      [cid, q, limit, offset]
    );
    const services = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      duration: `${r.duration_minutes} min`,
      price: Number(r.price),
      commission: r.commission_pct != null ? Number(r.commission_pct) : 0,
    }));
    res.json(services);
  } catch (e) {
    console.error('getServices:', e);
    res.status(500).json({ error: 'Erro ao listar serviços.' });
  }
}

export async function getProducts(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) return res.json([]);
    const moduleOk = await assertPlanModuleAccess(res, cid, 'inventory', 'Gestão de estoque');
    if (!moduleOk) return;
    const { limit, offset, q, order } = listParams(req);
    const { rows } = await pool.query(
      `SELECT id, name, category, stock, min_stock, price
       FROM public.products
       WHERE company_id = $1
         AND ($2 = '' OR name ILIKE '%' || $2 || '%' OR category ILIKE '%' || $2 || '%')
       ORDER BY name ${order}
       LIMIT $3 OFFSET $4`,
      [cid, q, limit, offset]
    );
    const products = rows.map((r: Record<string, unknown>) => {
      const stock = Number(r.stock);
      const min = Number(r.min_stock);
      let status = 'normal';
      if (stock < min * 0.5) status = 'critical';
      else if (stock <= min) status = 'low';
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        stock,
        minStock: min,
        price: Number(r.price),
        status,
      };
    });
    res.json(products);
  } catch (e) {
    console.error('getProducts:', e);
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
}

export async function getAppointments(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) return res.json([]);
    const { limit, offset, q, order } = listParams(req);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const { rows } = await pool.query(
      `SELECT a.id, a.client_id, a.pet_id, a.service_id, a.scheduled_at, a.duration_minutes, a.status, a.vet_name,
        c.name AS client_name, p.name AS pet_name, p.species AS pet_species, s.name AS service_name
       FROM public.appointments a
       JOIN public.clients c ON c.id = a.client_id
       JOIN public.pets p ON p.id = a.pet_id
       JOIN public.services s ON s.id = a.service_id
       WHERE a.company_id = $1
         AND a.scheduled_at::date >= CURRENT_DATE
         AND ($2 = '' OR a.status::text = $2)
         AND ($3 = '' OR c.name ILIKE '%' || $3 || '%' OR p.name ILIKE '%' || $3 || '%' OR s.name ILIKE '%' || $3 || '%')
       ORDER BY a.scheduled_at ${order}
       LIMIT $4 OFFSET $5`,
      [cid, status, q, limit, offset]
    );
    const appointments = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      client_id: r.client_id,
      pet_id: r.pet_id,
      service_id: r.service_id,
      scheduledAt: r.scheduled_at,
      time: new Date(r.scheduled_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration: `${r.duration_minutes} min`,
      client: r.client_name,
      pet: r.pet_name,
      petType: r.pet_species === 'Cão' ? 'Cachorro' : r.pet_species,
      service: r.service_name,
      status: r.status === 'scheduled' ? 'pending' : r.status === 'in_progress' ? 'in-progress' : r.status === 'confirmed' ? 'confirmed' : r.status,
      vet: r.vet_name ?? '',
    }));
    res.json(appointments);
  } catch (e) {
    console.error('getAppointments:', e);
    res.status(500).json({ error: 'Erro ao listar agendamentos.' });
  }
}

export async function getCompanies(req: AuthReq, res: Response) {
  try {
    const { limit, offset, q, order } = listParams(req);
    if (req.isSuperAdmin) {
      const { rows } = await pool.query(
        `SELECT c.id, c.name, c.status, c.created_at, c.current_plan_id, p.name AS plan_name,
          (SELECT COUNT(*)::int FROM public.profiles WHERE company_id = c.id) AS users_count
         FROM public.companies c
         LEFT JOIN public.plans p ON p.id = c.current_plan_id
         WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%')
         ORDER BY c.name ${order}
         LIMIT $2 OFFSET $3`,
        [q, limit, offset]
      );
      const companies = rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        name: r.name,
        plan: r.plan_name ?? '–',
        plan_id: r.current_plan_id,
        users: r.users_count ?? 0,
        status: r.status,
        mrr: 0,
        created: r.created_at,
      }));
      return res.json(companies);
    }
    const cid = companyId(req);
    if (!cid) return res.json([]);
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.status, c.created_at, c.current_plan_id, p.name AS plan_name,
        (SELECT COUNT(*)::int FROM public.profiles WHERE company_id = c.id) AS users_count
       FROM public.companies c
       LEFT JOIN public.plans p ON p.id = c.current_plan_id
       WHERE c.id = $1`,
      [cid]
    );
    res.json(rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      plan: r.plan_name ?? '–',
      plan_id: r.current_plan_id,
      users: r.users_count ?? 0,
      status: r.status,
      mrr: 0,
      created: r.created_at,
    })));
  } catch (e) {
    console.error('getCompanies:', e);
    res.status(500).json({ error: 'Erro ao listar empresas.' });
  }
}

export async function getTransactions(req: AuthReq, res: Response) {
  try {
    const cid = companyId(req);
    if (!cid) return res.json({ revenues: [], expenses: [], stats: [] });
    const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
    if (!moduleOk) return;
    const type = (req.query.type as string) || 'all';
    const { limit, offset, q } = listParams(req);

    const [revenues, expenses, totals] = await Promise.all([
      type === 'expense'
        ? { rows: [] }
        : pool.query(
            `SELECT id, date, description, value, status
             FROM public.transactions
             WHERE company_id = $1 AND type = 'revenue'
               AND ($2 = '' OR description ILIKE '%' || $2 || '%')
             ORDER BY date DESC
             LIMIT $3 OFFSET $4`,
            [cid, q, limit, offset]
          ),
      type === 'revenue'
        ? { rows: [] }
        : pool.query(
            `SELECT id, date, description, category, value
             FROM public.transactions
             WHERE company_id = $1 AND type = 'expense'
               AND ($2 = '' OR description ILIKE '%' || $2 || '%' OR COALESCE(category, '') ILIKE '%' || $2 || '%')
             ORDER BY date DESC
             LIMIT $3 OFFSET $4`,
            [cid, q, limit, offset]
          ),
      pool.query(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'revenue' THEN value ELSE 0 END),0)::float AS rev,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END),0)::float AS exp
         FROM public.transactions WHERE company_id = $1 AND date >= date_trunc('month', CURRENT_DATE)::date`,
        [cid]
      ),
    ]);

    const revTotal = Number(totals.rows[0]?.rev ?? 0);
    const expTotal = Number(totals.rows[0]?.exp ?? 0);

    const revenuesList = (revenues.rows || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      type: 'Serviço',
      value: Number(r.value),
      status: r.status ?? 'paid',
    }));
    const expensesList = (expenses.rows || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      category: r.category,
      value: Number(r.value),
    }));

    const stats = [
      { label: 'Receita Total (Mês)', value: `R$ ${revTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'TrendingUp' },
      { label: 'Despesas (Mês)', value: `R$ ${expTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'TrendingDown' },
      { label: 'Lucro Líquido', value: `R$ ${(revTotal - expTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'DollarSign' },
      { label: 'Caixa Atual', value: `R$ ${revTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: 'Wallet' },
    ];

    res.json({ revenues: revenuesList, expenses: expensesList, stats });
  } catch (e) {
    console.error('getTransactions:', e);
    res.status(500).json({ error: 'Erro ao listar transações.' });
  }
}

export async function getCompanySettings(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const [companyRes, settingsRes] = await Promise.all([
      pool.query(`SELECT name, cnpj, phone, address FROM public.companies WHERE id = $1`, [cid]),
      pool.query(`SELECT contact_email, website, hours FROM public.company_settings WHERE company_id = $1`, [cid]),
    ]);
    const company = companyRes.rows[0] ?? {};
    const settings = settingsRes.rows[0] ?? {};
    res.json({
      name: company.name ?? '',
      cnpj: company.cnpj ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      contact_email: settings.contact_email ?? '',
      website: settings.website ?? '',
      hours: settings.hours ?? '',
    });
  } catch (e) {
    console.error('getCompanySettings:', e);
    res.status(500).json({ error: 'Erro ao carregar configurações.' });
  }
}

export async function updateCompanySettings(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const parsed = parseWithSchema(res, companySettingsSchema, req.body);
    if (!parsed) return;
    const { name, cnpj, phone, address, contact_email, website, hours } = parsed;
    await pool.query(
      `UPDATE public.companies SET name = $1, cnpj = $2, phone = $3, address = $4 WHERE id = $5`,
      [name.trim(), toNull(cnpj), toNull(phone), toNull(address), cid]
    );
    await pool.query(
      `INSERT INTO public.company_settings (company_id, contact_email, website, hours)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id) DO UPDATE SET
        contact_email = EXCLUDED.contact_email,
        website = EXCLUDED.website,
        hours = EXCLUDED.hours`,
      [cid, toNull(contact_email), toNull(website), toNull(hours)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('updateCompanySettings:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao salvar configurações.');
  }
}

export async function getNotificationSettings(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const { rows } = await pool.query(
      `SELECT reminders, low_stock, payment_receipt, pet_birthday
       FROM public.notification_settings WHERE company_id = $1`,
      [cid]
    );
    const s = rows[0] ?? {};
    res.json({
      reminders: s.reminders ?? true,
      low_stock: s.low_stock ?? true,
      payment_receipt: s.payment_receipt ?? true,
      pet_birthday: s.pet_birthday ?? false,
    });
  } catch (e) {
    console.error('getNotificationSettings:', e);
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
}

export async function updateNotificationSettings(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const parsed = parseWithSchema(res, notificationSettingsSchema, req.body);
    if (!parsed) return;
    const { reminders, low_stock, payment_receipt, pet_birthday } = parsed;
    await pool.query(
      `INSERT INTO public.notification_settings (company_id, reminders, low_stock, payment_receipt, pet_birthday)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (company_id) DO UPDATE SET
         reminders = EXCLUDED.reminders,
         low_stock = EXCLUDED.low_stock,
         payment_receipt = EXCLUDED.payment_receipt,
         pet_birthday = EXCLUDED.pet_birthday`,
      [cid, !!reminders, !!low_stock, !!payment_receipt, !!pet_birthday]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('updateNotificationSettings:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao salvar notificações.');
  }
}

export async function getAppearanceSettings(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const { rows } = await pool.query(
      `SELECT theme, primary_color, logo_url FROM public.appearance_settings WHERE company_id = $1`,
      [cid]
    );
    const s = rows[0] ?? {};
    res.json({
      theme: s.theme ?? 'light',
      primary_color: s.primary_color ?? 'petpro',
      logo_url: s.logo_url ?? '',
    });
  } catch (e) {
    console.error('getAppearanceSettings:', e);
    res.status(500).json({ error: 'Erro ao carregar aparência.' });
  }
}

export async function updateAppearanceSettings(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const parsed = parseWithSchema(res, appearanceSettingsSchema, req.body);
    if (!parsed) return;
    const { theme, primary_color, logo_url } = parsed;
    await pool.query(
      `INSERT INTO public.appearance_settings (company_id, theme, primary_color, logo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id) DO UPDATE SET
         theme = EXCLUDED.theme,
         primary_color = EXCLUDED.primary_color,
         logo_url = EXCLUDED.logo_url`,
      [cid, theme ?? 'light', primary_color ?? 'petpro', toNull(logo_url)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('updateAppearanceSettings:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao salvar aparência.');
  }
}

export async function getUserSecuritySettings(req: AuthReq, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Não autenticado.' });
    const { rows } = await pool.query(
      `SELECT two_factor_enabled FROM public.user_security_settings WHERE user_id = $1`,
      [req.userId]
    );
    const s = rows[0] ?? {};
    res.json({ two_factor_enabled: s.two_factor_enabled ?? false });
  } catch (e) {
    console.error('getUserSecuritySettings:', e);
    res.status(500).json({ error: 'Erro ao carregar segurança.' });
  }
}

export async function updateUserSecuritySettings(req: AuthReq, res: Response) {
  try {
    if (!req.userId) return sendError(res, 401, 'UNAUTHORIZED', 'Não autenticado.');
    const parsed = parseWithSchema(res, securitySettingsSchema, req.body);
    if (!parsed) return;
    const { two_factor_enabled } = parsed;
    await pool.query(
      `INSERT INTO public.user_security_settings (user_id, two_factor_enabled)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET two_factor_enabled = EXCLUDED.two_factor_enabled`,
      [req.userId, !!two_factor_enabled]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('updateUserSecuritySettings:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao salvar segurança.');
  }
}

export async function getCompanyUsers(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const { rows } = await pool.query(
      `SELECT p.id, p.full_name, p.email, r.role
       FROM public.profiles p
       LEFT JOIN public.user_roles r ON r.user_id = p.id AND r.company_id = $1
       WHERE p.company_id = $1
       ORDER BY p.full_name`,
      [cid]
    );
    res.json(rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.full_name,
      email: r.email,
      role: r.role ?? 'usuario',
    })));
  } catch (e) {
    console.error('getCompanyUsers:', e);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

export async function updateCompanyUserRole(req: AuthReq, res: Response) {
  try {
    if (!req.isAdmin) return sendError(res, 403, 'FORBIDDEN', 'Acesso restrito a administradores.');
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const userId = req.params.id;
    const parsed = parseWithSchema(res, companyUserRoleSchema, req.body);
    if (!parsed) return;
    const { role } = parsed;
    await pool.query(`DELETE FROM public.user_roles WHERE user_id = $1 AND company_id = $2`, [userId, cid]);
    await pool.query(
      `INSERT INTO public.user_roles (user_id, role, company_id) VALUES ($1, $2, $3)`,
      [userId, role, cid]
    );
    await writeAuditLog({
      actor_user_id: req.userId ?? null,
      company_id: cid,
      ip_address: req.ip ?? null,
      user_agent: req.headers['user-agent'] ?? null,
      action: 'user.role.updated',
      entity_type: 'user',
      entity_id: userId,
      metadata: { role },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('updateCompanyUserRole:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar role.');
  }
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

export async function exportReport(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'reports', 'Relatórios');
    if (!moduleOk) return;
    const type = (req.query.type as string) || 'clients';
    let csv = '';
    let filename = `${type}.csv`;
    if (type === 'clients') {
      const { rows } = await pool.query(
        `SELECT name, email, phone, address, created_at FROM public.clients WHERE company_id = $1 ORDER BY name`,
        [cid]
      );
      csv = toCsv(['Nome', 'Email', 'Telefone', 'Endereço', 'Criado em'], rows.map((r) => [
        r.name, r.email, r.phone, r.address, r.created_at,
      ]));
      filename = 'clientes.csv';
    } else if (type === 'financial') {
      const { rows } = await pool.query(
        `SELECT type, date, description, category, value, status FROM public.transactions WHERE company_id = $1 ORDER BY date DESC`,
        [cid]
      );
      csv = toCsv(['Tipo', 'Data', 'Descrição', 'Categoria', 'Valor', 'Status'], rows.map((r) => [
        r.type, r.date, r.description, r.category, r.value, r.status,
      ]));
      filename = 'financeiro.csv';
    } else if (type === 'inventory') {
      const { rows } = await pool.query(
        `SELECT name, category, stock, min_stock, price FROM public.products WHERE company_id = $1 ORDER BY name`,
        [cid]
      );
      csv = toCsv(['Produto', 'Categoria', 'Estoque', 'Mínimo', 'Preço'], rows.map((r) => [
        r.name, r.category, r.stock, r.min_stock, r.price,
      ]));
      filename = 'estoque.csv';
    } else if (type === 'services') {
      const { rows } = await pool.query(
        `SELECT name, category, duration_minutes, price, commission_pct FROM public.services WHERE company_id = $1 ORDER BY name`,
        [cid]
      );
      csv = toCsv(['Serviço', 'Categoria', 'Duração (min)', 'Preço', 'Comissão (%)'], rows.map((r) => [
        r.name, r.category, r.duration_minutes, r.price, r.commission_pct,
      ]));
      filename = 'servicos.csv';
    } else {
      return res.status(400).json({ error: 'Tipo de relatório inválido.' });
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e) {
    console.error('exportReport:', e);
    res.status(500).json({ error: 'Erro ao exportar relatório.' });
  }
}

export async function getPlans(req: AuthReq, res: Response) {
  try {
    if (!req.isSuperAdmin) return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
    const { rows } = await pool.query(
      `SELECT id, name, description, price, trial_days, max_users, max_pets, is_active FROM public.plans ORDER BY price ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error('getPlans:', e);
    res.status(500).json({ error: 'Erro ao listar planos.' });
  }
}

export async function updatePlan(req: AuthReq, res: Response) {
  try {
    if (!req.isSuperAdmin) return sendError(res, 403, 'FORBIDDEN', 'Acesso restrito a superadmin.');
    const id = req.params.id;
    const parsed = parseWithSchema(res, planPayloadSchema, req.body);
    if (!parsed) return;
    const { name, description, price, trial_days, max_users, max_pets, is_active } = parsed;
    const { rows } = await pool.query(
      `UPDATE public.plans
       SET name = $1, description = $2, price = $3, trial_days = $4, max_users = $5, max_pets = $6, is_active = $7
       WHERE id = $8
       RETURNING id, name, description, price, trial_days, max_users, max_pets, is_active`,
      [name.trim(), description?.trim() || null, Number(price), Number(trial_days), max_users ?? null, max_pets ?? null, !!is_active, id]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Plano não encontrado.');
    await writeAuditLog({
      actor_user_id: req.userId ?? null,
      company_id: req.companyId ?? null,
      ip_address: req.ip ?? null,
      user_agent: req.headers['user-agent'] ?? null,
      action: 'plan.updated',
      entity_type: 'plan',
      entity_id: id,
      metadata: { name, price, trial_days, max_users, max_pets, is_active },
    });
    res.json(rows[0]);
  } catch (e) {
    console.error('updatePlan:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar plano.');
  }
}

export async function createCompany(req: AuthReq, res: Response) {
  try {
    if (!req.isSuperAdmin) return sendError(res, 403, 'FORBIDDEN', 'Acesso restrito a superadmin.');
    const parsed = parseWithSchema(res, companyPayloadSchema, req.body);
    if (!parsed) return;
    const { name, cnpj, phone, address, status, current_plan_id } = parsed;
    const { rows } = await pool.query(
      `INSERT INTO public.companies (name, cnpj, phone, address, status, current_plan_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, status, created_at`,
      [name.trim(), toNull(cnpj), toNull(phone), toNull(address), status ?? 'trial', toNull(current_plan_id ?? null)]
    );
    await writeAuditLog({
      actor_user_id: req.userId ?? null,
      company_id: req.companyId ?? null,
      ip_address: req.ip ?? null,
      user_agent: req.headers['user-agent'] ?? null,
      action: 'company.created',
      entity_type: 'company',
      entity_id: rows[0]?.id,
      metadata: { name, status: status ?? 'trial', current_plan_id: toNull(current_plan_id ?? null) },
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('createCompany:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar empresa.');
  }
}

export async function updateCompany(req: AuthReq, res: Response) {
  try {
    if (!req.isSuperAdmin) return sendError(res, 403, 'FORBIDDEN', 'Acesso restrito a superadmin.');
    const id = req.params.id;
    const parsed = parseWithSchema(res, companyPayloadSchema, req.body);
    if (!parsed) return;
    const { name, cnpj, phone, address, status, current_plan_id } = parsed;
    const { rows } = await pool.query(
      `UPDATE public.companies
       SET name = $1, cnpj = $2, phone = $3, address = $4, status = $5, current_plan_id = $6
       WHERE id = $7
       RETURNING id, name, status, created_at`,
      [name.trim(), toNull(cnpj), toNull(phone), toNull(address), status ?? 'trial', toNull(current_plan_id ?? null), id]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Empresa não encontrada.');
    await writeAuditLog({
      actor_user_id: req.userId ?? null,
      company_id: req.companyId ?? null,
      ip_address: req.ip ?? null,
      user_agent: req.headers['user-agent'] ?? null,
      action: 'company.updated',
      entity_type: 'company',
      entity_id: id,
      metadata: { name, status: status ?? 'trial', current_plan_id: toNull(current_plan_id ?? null) },
    });
    res.json(rows[0]);
  } catch (e) {
    console.error('updateCompany:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar empresa.');
  }
}

export async function exportCompanies(req: AuthReq, res: Response) {
  try {
    if (!req.isSuperAdmin) return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
    const { rows } = await pool.query(
      `SELECT name, status, created_at FROM public.companies ORDER BY name`
    );
    const csv = toCsv(['Empresa', 'Status', 'Criado em'], rows.map((r) => [r.name, r.status, r.created_at]));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="empresas.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('exportCompanies:', e);
    res.status(500).json({ error: 'Erro ao exportar empresas.' });
  }
}

export async function getAdminMetrics(req: AuthReq, res: Response) {
  try {
    if (!req.isSuperAdmin) return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
    const monthStart = "date_trunc('month', CURRENT_DATE)::date";
    const prevMonthStart = "date_trunc('month', CURRENT_DATE - interval '1 month')::date";
    const prevMonthEnd = "(date_trunc('month', CURRENT_DATE) - interval '1 day')::date";

    const [
      totalCompanies,
      activeCompanies,
      trialCompanies,
      pastDueCompanies,
      cancelledCompanies,
      newCompanies30d,
      totalUsers,
      mrr,
      revenueMonth,
      revenuePrevMonth,
      companiesByStatus,
      companiesByMonth,
      revenueByMonth,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS c FROM public.companies`),
      pool.query(`SELECT COUNT(*)::int AS c FROM public.companies WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM public.companies WHERE status = 'trial'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM public.companies WHERE status = 'past_due'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM public.companies WHERE status = 'cancelled'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM public.companies WHERE created_at >= (CURRENT_DATE - interval '30 days')`),
      pool.query(`SELECT COUNT(*)::int AS c FROM public.profiles`),
      pool.query(
        `SELECT COALESCE(SUM(p.price),0)::float AS total
         FROM public.companies c
         LEFT JOIN public.plans p ON p.id = c.current_plan_id
         WHERE c.status = 'active'`
      ),
      pool.query(
        `SELECT COALESCE(SUM(value),0)::float AS total
         FROM public.transactions
         WHERE type = 'revenue' AND date >= ${monthStart}`
      ),
      pool.query(
        `SELECT COALESCE(SUM(value),0)::float AS total
         FROM public.transactions
         WHERE type = 'revenue' AND date BETWEEN ${prevMonthStart} AND ${prevMonthEnd}`
      ),
      pool.query(
        `SELECT status, COUNT(*)::int AS c
         FROM public.companies
         GROUP BY status
         ORDER BY status`
      ),
      pool.query(
        `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS c
         FROM public.companies
         WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '5 months'
         GROUP BY 1
         ORDER BY 1`
      ),
      pool.query(
        `SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month, COALESCE(SUM(value),0)::float AS total
         FROM public.transactions
         WHERE type = 'revenue' AND date >= date_trunc('month', CURRENT_DATE) - interval '5 months'
         GROUP BY 1
         ORDER BY 1`
      ),
    ]);

    const active = activeCompanies.rows[0]?.c ?? 0;
    const mrrTotal = Number(mrr.rows[0]?.total ?? 0);
    const revNow = Number(revenueMonth.rows[0]?.total ?? 0);
    const revPrev = Number(revenuePrevMonth.rows[0]?.total ?? 0);
    const revChange = revPrev === 0 ? 0 : ((revNow - revPrev) / revPrev) * 100;
    const arpu = active > 0 ? mrrTotal / active : 0;

    res.json({
      stats: {
        total_companies: totalCompanies.rows[0]?.c ?? 0,
        active_companies: active,
        trial_companies: trialCompanies.rows[0]?.c ?? 0,
        past_due_companies: pastDueCompanies.rows[0]?.c ?? 0,
        cancelled_companies: cancelledCompanies.rows[0]?.c ?? 0,
        new_companies_30d: newCompanies30d.rows[0]?.c ?? 0,
        total_users: totalUsers.rows[0]?.c ?? 0,
        mrr: mrrTotal,
        arpu,
        revenue_month: revNow,
        revenue_change_pct: revChange,
      },
      charts: {
        companies_by_status: companiesByStatus.rows.map((r: { status: string; c: number }) => ({
          status: r.status,
          count: r.c,
        })),
        companies_by_month: companiesByMonth.rows.map((r: { month: string; c: number }) => ({
          month: r.month,
          value: r.c,
        })),
        revenue_by_month: revenueByMonth.rows.map((r: { month: string; total: number }) => ({
          month: r.month,
          value: Number(r.total),
        })),
      },
    });
  } catch (e) {
    console.error('getAdminMetrics:', e);
    res.status(500).json({ error: 'Erro ao carregar métricas.' });
  }
}

function ensureCompanyId(req: AuthReq, res: Response): string | null {
  const cid = companyId(req);
  if (!cid) {
    sendError(res, 403, 'FORBIDDEN', 'Usuário não está vinculado a nenhuma empresa.');
    return null;
  }
  return cid;
}

async function ensureCompanyRow(
  table: 'clients' | 'pets' | 'services' | 'products' | 'appointments' | 'transactions' | 'medical_records',
  id: string,
  companyIdVal: string
) {
  const { rows } = await pool.query(
    `SELECT id FROM public.${table} WHERE id = $1 AND company_id = $2`,
    [id, companyIdVal]
  );
  return rows.length > 0;
}

export async function createClient(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const parsed = parseWithSchema(res, clientPayloadSchema, req.body);
    if (!parsed) return;
    const { name, email, phone, address } = parsed;
    const { rows } = await pool.query(
      `INSERT INTO public.clients (company_id, name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, address, created_at`,
      [cid, name.trim(), toNull(email), toNull(phone), toNull(address)]
    );
    const c = rows[0];
    res.status(201).json({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      pets: 0,
      lastVisit: c.created_at,
      status: 'active',
    });
  } catch (e) {
    console.error('createClient:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar cliente.');
  }
}

export async function updateClient(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const parsed = parseWithSchema(res, clientPayloadSchema, req.body);
    if (!parsed) return;
    const { name, email, phone, address } = parsed;
    const { rows } = await pool.query(
      `UPDATE public.clients
       SET name = $1, email = $2, phone = $3, address = $4
       WHERE id = $5 AND company_id = $6
       RETURNING id, name, email, phone, address, created_at`,
      [name.trim(), toNull(email), toNull(phone), toNull(address), id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Cliente não encontrado.');
    const c = rows[0];
    const petsCount = await pool.query(
      `SELECT COUNT(*)::int AS c FROM public.pets WHERE client_id = $1`,
      [c.id]
    );
    res.json({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      pets: petsCount.rows[0]?.c ?? 0,
      lastVisit: c.created_at,
      status: 'active',
    });
  } catch (e) {
    console.error('updateClient:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar cliente.');
  }
}

export async function deleteClient(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const { rowCount } = await pool.query(
      `DELETE FROM public.clients WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Cliente não encontrado.');
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteClient:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover cliente.');
  }
}

export async function createPet(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const petsLimitOk = await assertPlanLimit(res, cid, { entity: 'pets', entityLabel: 'pets', table: 'pets' });
    if (!petsLimitOk) return;
    const parsed = parseWithSchema(res, petPayloadSchema, req.body);
    if (!parsed) return;
    const { client_id, name, species, breed, birth_date } = parsed;
    const clientOk = await ensureCompanyRow('clients', client_id, cid);
    if (!clientOk) return sendError(res, 400, 'VALIDATION_ERROR', 'Tutor inválido.', 'client_id');
    const { rows } = await pool.query(
      `INSERT INTO public.pets (company_id, client_id, name, species, breed, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, species, breed, birth_date, created_at`,
      [cid, client_id, name.trim(), species.trim(), toNull(breed), toNull(birth_date)]
    );
    const owner = await pool.query(`SELECT name FROM public.clients WHERE id = $1`, [client_id]);
    const p = rows[0];
    res.status(201).json({
      id: p.id,
      client_id,
      name: p.name,
      species: p.species,
      breed: p.breed ?? '',
      birth_date: p.birth_date ?? null,
      age: p.birth_date ? formatPetAge(p.birth_date as string) : '',
      owner: owner.rows[0]?.name ?? '',
      lastVisit: p.created_at,
      status: 'healthy',
    });
  } catch (e) {
    console.error('createPet:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar pet.');
  }
}

export async function updatePet(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const parsed = parseWithSchema(res, petPayloadSchema, req.body);
    if (!parsed) return;
    const { client_id, name, species, breed, birth_date } = parsed;
    const clientOk = await ensureCompanyRow('clients', client_id, cid);
    if (!clientOk) return sendError(res, 400, 'VALIDATION_ERROR', 'Tutor inválido.', 'client_id');
    const { rows } = await pool.query(
      `UPDATE public.pets
       SET client_id = $1, name = $2, species = $3, breed = $4, birth_date = $5
       WHERE id = $6 AND company_id = $7
       RETURNING id, name, species, breed, birth_date, created_at`,
      [client_id, name.trim(), species.trim(), toNull(breed), toNull(birth_date), id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Pet não encontrado.');
    const owner = await pool.query(`SELECT name FROM public.clients WHERE id = $1`, [client_id]);
    const p = rows[0];
    res.json({
      id: p.id,
      client_id,
      name: p.name,
      species: p.species,
      breed: p.breed ?? '',
      birth_date: p.birth_date ?? null,
      age: p.birth_date ? formatPetAge(p.birth_date as string) : '',
      owner: owner.rows[0]?.name ?? '',
      lastVisit: p.created_at,
      status: 'healthy',
    });
  } catch (e) {
    console.error('updatePet:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar pet.');
  }
}

export async function deletePet(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const { rowCount } = await pool.query(
      `DELETE FROM public.pets WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Pet não encontrado.');
    res.json({ ok: true });
  } catch (e) {
    console.error('deletePet:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover pet.');
  }
}

export async function createService(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const parsed = parseWithSchema(res, servicePayloadSchema, req.body);
    if (!parsed) return;
    const { name, category, duration_minutes, price, commission_pct } = parsed;
    const { rows } = await pool.query(
      `INSERT INTO public.services (company_id, name, category, duration_minutes, price, commission_pct)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, category, duration_minutes, price, commission_pct`,
      [cid, name.trim(), category.trim(), Number(duration_minutes ?? 30), Number(price), commission_pct ?? null]
    );
    const s = rows[0];
    res.status(201).json({
      id: s.id,
      name: s.name,
      category: s.category,
      duration: `${s.duration_minutes} min`,
      price: Number(s.price),
      commission: s.commission_pct != null ? Number(s.commission_pct) : 0,
    });
  } catch (e) {
    console.error('createService:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar serviço.');
  }
}

export async function updateService(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const parsed = parseWithSchema(res, servicePayloadSchema, req.body);
    if (!parsed) return;
    const { name, category, duration_minutes, price, commission_pct } = parsed;
    const { rows } = await pool.query(
      `UPDATE public.services
       SET name = $1, category = $2, duration_minutes = $3, price = $4, commission_pct = $5
       WHERE id = $6 AND company_id = $7
       RETURNING id, name, category, duration_minutes, price, commission_pct`,
      [name.trim(), category.trim(), Number(duration_minutes ?? 30), Number(price), commission_pct ?? null, id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Serviço não encontrado.');
    const s = rows[0];
    res.json({
      id: s.id,
      name: s.name,
      category: s.category,
      duration: `${s.duration_minutes} min`,
      price: Number(s.price),
      commission: s.commission_pct != null ? Number(s.commission_pct) : 0,
    });
  } catch (e) {
    console.error('updateService:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar serviço.');
  }
}

export async function deleteService(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const { rowCount } = await pool.query(
      `DELETE FROM public.services WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Serviço não encontrado.');
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteService:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover serviço.');
  }
}

export async function createProduct(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'inventory', 'Gestão de estoque');
    if (!moduleOk) return;
    const parsed = parseWithSchema(res, productPayloadSchema, req.body);
    if (!parsed) return;
    const { name, category, stock, min_stock, price, unit } = parsed;
    const { rows } = await pool.query(
      `INSERT INTO public.products (company_id, name, category, stock, min_stock, price, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, category, stock, min_stock, price`,
      [cid, name.trim(), category.trim(), Number(stock ?? 0), Number(min_stock ?? 0), Number(price), toNull(unit) ?? 'un']
    );
    const p = rows[0];
    let status = 'normal';
    if (Number(p.stock) < Number(p.min_stock) * 0.5) status = 'critical';
    else if (Number(p.stock) <= Number(p.min_stock)) status = 'low';
    res.status(201).json({
      id: p.id,
      name: p.name,
      category: p.category,
      stock: Number(p.stock),
      minStock: Number(p.min_stock),
      price: Number(p.price),
      status,
    });
  } catch (e) {
    console.error('createProduct:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar produto.');
  }
}

export async function updateProduct(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'inventory', 'Gestão de estoque');
    if (!moduleOk) return;
    const id = req.params.id;
    const parsed = parseWithSchema(res, productPayloadSchema, req.body);
    if (!parsed) return;
    const { name, category, stock, min_stock, price, unit } = parsed;
    const { rows } = await pool.query(
      `UPDATE public.products
       SET name = $1, category = $2, stock = $3, min_stock = $4, price = $5, unit = $6
       WHERE id = $7 AND company_id = $8
       RETURNING id, name, category, stock, min_stock, price`,
      [name.trim(), category.trim(), Number(stock ?? 0), Number(min_stock ?? 0), Number(price), toNull(unit) ?? 'un', id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Produto não encontrado.');
    const p = rows[0];
    let status = 'normal';
    if (Number(p.stock) < Number(p.min_stock) * 0.5) status = 'critical';
    else if (Number(p.stock) <= Number(p.min_stock)) status = 'low';
    res.json({
      id: p.id,
      name: p.name,
      category: p.category,
      stock: Number(p.stock),
      minStock: Number(p.min_stock),
      price: Number(p.price),
      status,
    });
  } catch (e) {
    console.error('updateProduct:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar produto.');
  }
}

export async function deleteProduct(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'inventory', 'Gestão de estoque');
    if (!moduleOk) return;
    const id = req.params.id;
    const { rowCount } = await pool.query(
      `DELETE FROM public.products WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Produto não encontrado.');
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteProduct:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover produto.');
  }
}

export async function createAppointment(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const parsed = parseWithSchema(res, appointmentPayloadSchema, req.body);
    if (!parsed) return;
    const { client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name, notes } = parsed;
    const clientOk = await ensureCompanyRow('clients', client_id, cid);
    const petOk = await ensureCompanyRow('pets', pet_id, cid);
    const serviceOk = await ensureCompanyRow('services', service_id, cid);
    if (!clientOk || !petOk || !serviceOk) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos para o agendamento.');
    }
    const petOwner = await pool.query(
      `SELECT client_id FROM public.pets WHERE id = $1`,
      [pet_id]
    );
    if (petOwner.rows[0]?.client_id !== client_id) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Pet não pertence ao cliente informado.', 'pet_id');
    }
    const { rows } = await pool.query(
      `INSERT INTO public.appointments (company_id, client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, scheduled_at, duration_minutes, status, vet_name`,
      [cid, client_id, pet_id, service_id, scheduled_at, Number(duration_minutes ?? 30), status ?? 'scheduled', toNull(vet_name), toNull(notes)]
    );
    const joined = await pool.query(
      `SELECT c.name AS client_name, p.name AS pet_name, p.species AS pet_species, s.name AS service_name
       FROM public.clients c
       JOIN public.pets p ON p.id = $1
       JOIN public.services s ON s.id = $2
       WHERE c.id = $3`,
      [pet_id, service_id, client_id]
    );
    const meta = joined.rows[0];
    const a = rows[0];
    await syncAppointmentReminder({
      companyId: cid,
      appointmentId: a.id,
      clientId: client_id,
      petId: pet_id,
      scheduledAt: a.scheduled_at,
      status: a.status,
    });
    res.status(201).json({
      id: a.id,
      client_id,
      pet_id,
      service_id,
      scheduledAt: a.scheduled_at,
      time: new Date(a.scheduled_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration: `${a.duration_minutes} min`,
      client: meta?.client_name ?? '',
      pet: meta?.pet_name ?? '',
      petType: meta?.pet_species === 'Cão' ? 'Cachorro' : meta?.pet_species,
      service: meta?.service_name ?? '',
      status: a.status === 'scheduled' ? 'pending' : a.status === 'in_progress' ? 'in-progress' : a.status === 'confirmed' ? 'confirmed' : a.status,
      vet: a.vet_name ?? '',
    });
  } catch (e) {
    console.error('createAppointment:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar agendamento.');
  }
}

export async function updateAppointment(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const parsed = parseWithSchema(res, appointmentPayloadSchema, req.body);
    if (!parsed) return;
    const { client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name, notes } = parsed;
    const clientOk = await ensureCompanyRow('clients', client_id, cid);
    const petOk = await ensureCompanyRow('pets', pet_id, cid);
    const serviceOk = await ensureCompanyRow('services', service_id, cid);
    if (!clientOk || !petOk || !serviceOk) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Dados inválidos para o agendamento.');
    }
    const petOwner = await pool.query(
      `SELECT client_id FROM public.pets WHERE id = $1`,
      [pet_id]
    );
    if (petOwner.rows[0]?.client_id !== client_id) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Pet não pertence ao cliente informado.', 'pet_id');
    }
    const { rows } = await pool.query(
      `UPDATE public.appointments
       SET client_id = $1, pet_id = $2, service_id = $3, scheduled_at = $4, duration_minutes = $5, status = $6, vet_name = $7, notes = $8
       WHERE id = $9 AND company_id = $10
       RETURNING id, scheduled_at, duration_minutes, status, vet_name`,
      [client_id, pet_id, service_id, scheduled_at, Number(duration_minutes ?? 30), status ?? 'scheduled', toNull(vet_name), toNull(notes), id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Agendamento não encontrado.');
    const joined = await pool.query(
      `SELECT c.name AS client_name, p.name AS pet_name, p.species AS pet_species, s.name AS service_name
       FROM public.clients c
       JOIN public.pets p ON p.id = $1
       JOIN public.services s ON s.id = $2
       WHERE c.id = $3`,
      [pet_id, service_id, client_id]
    );
    const meta = joined.rows[0];
    const a = rows[0];
    await syncAppointmentReminder({
      companyId: cid,
      appointmentId: a.id,
      clientId: client_id,
      petId: pet_id,
      scheduledAt: a.scheduled_at,
      status: a.status,
    });
    res.json({
      id: a.id,
      client_id,
      pet_id,
      service_id,
      scheduledAt: a.scheduled_at,
      time: new Date(a.scheduled_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration: `${a.duration_minutes} min`,
      client: meta?.client_name ?? '',
      pet: meta?.pet_name ?? '',
      petType: meta?.pet_species === 'Cão' ? 'Cachorro' : meta?.pet_species,
      service: meta?.service_name ?? '',
      status: a.status === 'scheduled' ? 'pending' : a.status === 'in_progress' ? 'in-progress' : a.status === 'confirmed' ? 'confirmed' : a.status,
      vet: a.vet_name ?? '',
    });
  } catch (e) {
    console.error('updateAppointment:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar agendamento.');
  }
}

export async function deleteAppointment(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const id = req.params.id;
    const { rowCount } = await pool.query(
      `DELETE FROM public.appointments WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Agendamento não encontrado.');
    try {
      await cancelAppointmentReminders(cid, id, 'Agendamento removido.');
    } catch (e) {
      console.warn('cancelAppointmentReminders:', e);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteAppointment:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover agendamento.');
  }
}

export async function getReminders(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'reminders', 'Lembretes');
    if (!moduleOk) return;
    const { limit, offset, q, order } = listParams(req);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';

    const { rows } = await pool.query(
      `SELECT
         r.id,
         r.appointment_id,
         r.reminder_type,
         r.channel,
         r.status,
         r.scheduled_for,
         r.sent_at,
         r.error_message,
         r.created_at,
         p.name AS pet_name,
         c.name AS client_name,
         a.scheduled_at AS appointment_at
       FROM public.reminder_jobs r
       LEFT JOIN public.pets p ON p.id = r.pet_id
       LEFT JOIN public.clients c ON c.id = r.client_id
       LEFT JOIN public.appointments a ON a.id = r.appointment_id
       WHERE r.company_id = $1
         AND ($2 = '' OR r.status = $2)
         AND (
           $3 = '' OR
           COALESCE(p.name, '') ILIKE '%' || $3 || '%' OR
           COALESCE(c.name, '') ILIKE '%' || $3 || '%' OR
           COALESCE(r.reminder_type, '') ILIKE '%' || $3 || '%'
         )
       ORDER BY r.scheduled_for ${order}
       LIMIT $4 OFFSET $5`,
      [cid, status, q, limit, offset]
    );

    res.json(
      rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        appointment_id: r.appointment_id,
        reminder_type: r.reminder_type,
        channel: r.channel,
        status: r.status,
        scheduled_for: r.scheduled_for,
        sent_at: r.sent_at,
        error_message: r.error_message,
        created_at: r.created_at,
        pet_name: r.pet_name ?? '',
        client_name: r.client_name ?? '',
        appointment_at: r.appointment_at,
      }))
    );
  } catch (e) {
    console.error('getReminders:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao listar lembretes.');
  }
}

export async function processDueReminders(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'reminders', 'Lembretes');
    if (!moduleOk) return;

    const parsed = parseWithSchema(res, reminderProcessPayloadSchema, req.body ?? {});
    if (!parsed) return;
    const limit = parsed.limit ?? 50;

    const { rows } = await pool.query(
      `WITH due AS (
         SELECT id
         FROM public.reminder_jobs
         WHERE company_id = $1
           AND status = 'pending'
           AND scheduled_for <= now()
         ORDER BY scheduled_for ASC
         LIMIT $2
       )
       UPDATE public.reminder_jobs r
       SET status = 'sent',
           sent_at = now(),
           error_message = NULL
       FROM due
       WHERE r.id = due.id
       RETURNING r.id, r.reminder_type, r.channel, r.scheduled_for, r.sent_at`,
      [cid, limit]
    );

    res.json({
      processed: rows.length,
      reminders: rows,
    });
  } catch (e) {
    console.error('processDueReminders:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao processar lembretes.');
  }
}

export async function cancelReminder(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'reminders', 'Lembretes');
    if (!moduleOk) return;
    const id = req.params.id;

    const { rows } = await pool.query(
      `UPDATE public.reminder_jobs
       SET status = 'cancelled',
           error_message = COALESCE(error_message, 'Cancelado manualmente.')
       WHERE id = $1
         AND company_id = $2
         AND status = 'pending'
       RETURNING id`,
      [id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Lembrete não encontrado ou já processado.');
    res.json({ ok: true });
  } catch (e) {
    console.error('cancelReminder:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao cancelar lembrete.');
  }
}

export async function getMedicalRecords(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'medical_records', 'Prontuário clínico');
    if (!moduleOk) return;

    const { limit, offset, q, order } = listParams(req);
    const rawPetId = typeof req.query.pet_id === 'string' ? req.query.pet_id.trim() : '';
    if (rawPetId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawPetId)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Pet inválido.', 'pet_id');
    }
    const petId = rawPetId || null;

    const { rows } = await pool.query(
      `SELECT
         mr.id,
         mr.pet_id,
         mr.appointment_id,
         mr.record_date,
         mr.weight_kg,
         mr.temperature_c,
         mr.diagnosis,
         mr.treatment,
         mr.notes,
         mr.created_at,
         p.name AS pet_name,
         c.name AS client_name
       FROM public.medical_records mr
       JOIN public.pets p ON p.id = mr.pet_id
       JOIN public.clients c ON c.id = p.client_id
       WHERE mr.company_id = $1
         AND ($2::uuid IS NULL OR mr.pet_id = $2::uuid)
         AND (
           $3 = '' OR
           p.name ILIKE '%' || $3 || '%' OR
           c.name ILIKE '%' || $3 || '%' OR
           COALESCE(mr.diagnosis, '') ILIKE '%' || $3 || '%'
         )
       ORDER BY mr.record_date ${order}, mr.created_at ${order}
       LIMIT $4 OFFSET $5`,
      [cid, petId, q, limit, offset]
    );

    res.json(
      rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        pet_id: r.pet_id,
        appointment_id: r.appointment_id,
        record_date: r.record_date,
        weight_kg: r.weight_kg != null ? Number(r.weight_kg) : null,
        temperature_c: r.temperature_c != null ? Number(r.temperature_c) : null,
        diagnosis: r.diagnosis ?? '',
        treatment: r.treatment ?? '',
        notes: r.notes ?? '',
        created_at: r.created_at,
        pet_name: r.pet_name,
        client_name: r.client_name,
      }))
    );
  } catch (e) {
    console.error('getMedicalRecords:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao listar prontuários.');
  }
}

export async function createMedicalRecord(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'medical_records', 'Prontuário clínico');
    if (!moduleOk) return;

    const parsed = parseWithSchema(res, medicalRecordPayloadSchema, req.body);
    if (!parsed) return;
    const { pet_id, appointment_id, record_date, weight_kg, temperature_c, diagnosis, treatment, notes } = parsed;

    const petOk = await ensureCompanyRow('pets', pet_id, cid);
    if (!petOk) return sendError(res, 400, 'VALIDATION_ERROR', 'Pet inválido.', 'pet_id');
    if (appointment_id) {
      const aptOk = await ensureCompanyRow('appointments', appointment_id, cid);
      if (!aptOk) return sendError(res, 400, 'VALIDATION_ERROR', 'Agendamento inválido.', 'appointment_id');
    }

    const { rows } = await pool.query(
      `INSERT INTO public.medical_records
        (company_id, pet_id, appointment_id, record_date, weight_kg, temperature_c, diagnosis, treatment, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, pet_id, appointment_id, record_date, weight_kg, temperature_c, diagnosis, treatment, notes, created_at`,
      [
        cid,
        pet_id,
        toNull(appointment_id),
        record_date,
        weight_kg ?? null,
        temperature_c ?? null,
        toNull(diagnosis),
        toNull(treatment),
        toNull(notes),
        req.userId ?? null,
      ]
    );
    const row = rows[0];

    const petMeta = await pool.query(
      `SELECT p.name AS pet_name, c.name AS client_name
       FROM public.pets p
       JOIN public.clients c ON c.id = p.client_id
       WHERE p.id = $1`,
      [pet_id]
    );

    res.status(201).json({
      id: row.id,
      pet_id: row.pet_id,
      appointment_id: row.appointment_id,
      record_date: row.record_date,
      weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
      temperature_c: row.temperature_c != null ? Number(row.temperature_c) : null,
      diagnosis: row.diagnosis ?? '',
      treatment: row.treatment ?? '',
      notes: row.notes ?? '',
      created_at: row.created_at,
      pet_name: petMeta.rows[0]?.pet_name ?? '',
      client_name: petMeta.rows[0]?.client_name ?? '',
    });
  } catch (e) {
    console.error('createMedicalRecord:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar prontuário.');
  }
}

export async function updateMedicalRecord(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'medical_records', 'Prontuário clínico');
    if (!moduleOk) return;

    const id = req.params.id;
    const parsed = parseWithSchema(res, medicalRecordPayloadSchema, req.body);
    if (!parsed) return;
    const { pet_id, appointment_id, record_date, weight_kg, temperature_c, diagnosis, treatment, notes } = parsed;

    const petOk = await ensureCompanyRow('pets', pet_id, cid);
    if (!petOk) return sendError(res, 400, 'VALIDATION_ERROR', 'Pet inválido.', 'pet_id');
    if (appointment_id) {
      const aptOk = await ensureCompanyRow('appointments', appointment_id, cid);
      if (!aptOk) return sendError(res, 400, 'VALIDATION_ERROR', 'Agendamento inválido.', 'appointment_id');
    }

    const { rows } = await pool.query(
      `UPDATE public.medical_records
       SET pet_id = $1,
           appointment_id = $2,
           record_date = $3,
           weight_kg = $4,
           temperature_c = $5,
           diagnosis = $6,
           treatment = $7,
           notes = $8
       WHERE id = $9 AND company_id = $10
       RETURNING id, pet_id, appointment_id, record_date, weight_kg, temperature_c, diagnosis, treatment, notes, created_at`,
      [
        pet_id,
        toNull(appointment_id),
        record_date,
        weight_kg ?? null,
        temperature_c ?? null,
        toNull(diagnosis),
        toNull(treatment),
        toNull(notes),
        id,
        cid,
      ]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Prontuário não encontrado.');
    const row = rows[0];

    const petMeta = await pool.query(
      `SELECT p.name AS pet_name, c.name AS client_name
       FROM public.pets p
       JOIN public.clients c ON c.id = p.client_id
       WHERE p.id = $1`,
      [pet_id]
    );

    res.json({
      id: row.id,
      pet_id: row.pet_id,
      appointment_id: row.appointment_id,
      record_date: row.record_date,
      weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
      temperature_c: row.temperature_c != null ? Number(row.temperature_c) : null,
      diagnosis: row.diagnosis ?? '',
      treatment: row.treatment ?? '',
      notes: row.notes ?? '',
      created_at: row.created_at,
      pet_name: petMeta.rows[0]?.pet_name ?? '',
      client_name: petMeta.rows[0]?.client_name ?? '',
    });
  } catch (e) {
    console.error('updateMedicalRecord:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar prontuário.');
  }
}

export async function deleteMedicalRecord(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'medical_records', 'Prontuário clínico');
    if (!moduleOk) return;
    const id = req.params.id;

    const { rowCount } = await pool.query(
      `DELETE FROM public.medical_records WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Prontuário não encontrado.');
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteMedicalRecord:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover prontuário.');
  }
}

export async function createTransaction(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
    if (!moduleOk) return;
    const parsed = parseWithSchema(res, transactionPayloadSchema, req.body);
    if (!parsed) return;
    const { type, date, description, category, value, status } = parsed;
    const { rows } = await pool.query(
      `INSERT INTO public.transactions (company_id, type, date, description, category, value, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, date, description, category, value, status`,
      [cid, type, date, description.trim(), toNull(category), Number(value), toNull(status)]
    );
    const t = rows[0];
    if (type === 'revenue') {
      return res.status(201).json({
        id: t.id,
        date: t.date,
        description: t.description,
        type: 'Serviço',
        value: Number(t.value),
        status: t.status ?? 'paid',
      });
    }
    return res.status(201).json({
      id: t.id,
      date: t.date,
      description: t.description,
      category: t.category,
      value: Number(t.value),
    });
  } catch (e) {
    console.error('createTransaction:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar transação.');
  }
}

export async function updateTransaction(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
    if (!moduleOk) return;
    const id = req.params.id;
    const parsed = parseWithSchema(res, transactionPayloadSchema, req.body);
    if (!parsed) return;
    const { type, date, description, category, value, status } = parsed;
    const { rows } = await pool.query(
      `UPDATE public.transactions
       SET type = $1, date = $2, description = $3, category = $4, value = $5, status = $6
       WHERE id = $7 AND company_id = $8
       RETURNING id, date, description, category, value, status`,
      [type, date, description.trim(), toNull(category), Number(value), toNull(status), id, cid]
    );
    if (!rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Transação não encontrada.');
    const t = rows[0];
    if (type === 'revenue') {
      return res.json({
        id: t.id,
        date: t.date,
        description: t.description,
        type: 'Serviço',
        value: Number(t.value),
        status: t.status ?? 'paid',
      });
    }
    return res.json({
      id: t.id,
      date: t.date,
      description: t.description,
      category: t.category,
      value: Number(t.value),
    });
  } catch (e) {
    console.error('updateTransaction:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao atualizar transação.');
  }
}

export async function deleteTransaction(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
    if (!moduleOk) return;
    const id = req.params.id;
    const { rowCount } = await pool.query(
      `DELETE FROM public.transactions WHERE id = $1 AND company_id = $2`,
      [id, cid]
    );
    if (!rowCount) return sendError(res, 404, 'NOT_FOUND', 'Transação não encontrada.');
    res.json({ ok: true });
  } catch (e) {
    console.error('deleteTransaction:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao remover transação.');
  }
}

export async function getCashbook(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
    if (!moduleOk) return;
    const { limit, offset, q, order } = listParams(req);
    const entryType = typeof req.query.entry_type === 'string' ? req.query.entry_type.trim() : '';

    const [entriesRes, statsRes] = await Promise.all([
      pool.query(
        `SELECT
           ce.id,
           ce.transaction_id,
           ce.entry_type,
           ce.amount,
           ce.payment_method,
           ce.description,
           ce.occurred_at,
           ce.reference_type,
           ce.reference_id,
           t.status AS transaction_status
         FROM public.cash_entries ce
         LEFT JOIN public.transactions t ON t.id = ce.transaction_id
         WHERE ce.company_id = $1
           AND ($2 = '' OR ce.entry_type = $2)
           AND (
             $3 = '' OR
             ce.description ILIKE '%' || $3 || '%' OR
             COALESCE(ce.payment_method, '') ILIKE '%' || $3 || '%'
           )
         ORDER BY ce.occurred_at ${order}
         LIMIT $4 OFFSET $5`,
        [cid, entryType, q, limit, offset]
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN entry_type = 'inflow' THEN amount ELSE 0 END), 0)::float AS total_inflow,
           COALESCE(SUM(CASE WHEN entry_type = 'outflow' THEN amount ELSE 0 END), 0)::float AS total_outflow,
           COALESCE(SUM(CASE WHEN entry_type = 'inflow' THEN amount ELSE -amount END), 0)::float AS balance,
           COALESCE(SUM(CASE WHEN entry_type = 'inflow' AND occurred_at >= date_trunc('month', now()) THEN amount ELSE 0 END), 0)::float AS inflow_month,
           COALESCE(SUM(CASE WHEN entry_type = 'outflow' AND occurred_at >= date_trunc('month', now()) THEN amount ELSE 0 END), 0)::float AS outflow_month
         FROM public.cash_entries
         WHERE company_id = $1`,
        [cid]
      ),
    ]);

    const stats = statsRes.rows[0] ?? {};
    res.json({
      stats: {
        total_inflow: Number(stats.total_inflow ?? 0),
        total_outflow: Number(stats.total_outflow ?? 0),
        balance: Number(stats.balance ?? 0),
        inflow_month: Number(stats.inflow_month ?? 0),
        outflow_month: Number(stats.outflow_month ?? 0),
      },
      entries: entriesRes.rows.map((r: Record<string, unknown>) => ({
        id: r.id,
        transaction_id: r.transaction_id,
        entry_type: r.entry_type,
        amount: Number(r.amount ?? 0),
        payment_method: r.payment_method ?? 'other',
        description: r.description ?? '',
        occurred_at: r.occurred_at,
        reference_type: r.reference_type,
        reference_id: r.reference_id,
        transaction_status: r.transaction_status ?? null,
      })),
    });
  } catch (e) {
    console.error('getCashbook:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao carregar caixa.');
  }
}

export async function createCashEntry(req: AuthReq, res: Response) {
  const cid = ensureCompanyId(req, res);
  if (!cid) return;
  const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
  if (!moduleOk) return;
  const parsed = parseWithSchema(res, cashEntryPayloadSchema, req.body);
  if (!parsed) return;

  const { entry_type, amount, description, payment_method, occurred_at } = parsed;
  const occurredAt = occurred_at ? new Date(occurred_at) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Data/hora inválida.', 'occurred_at');
  }

  const transactionType = entry_type === 'inflow' ? 'revenue' : 'expense';
  const status = entry_type === 'inflow' ? 'paid' : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const transactionRes = await client.query(
      `INSERT INTO public.transactions
        (company_id, type, date, description, category, value, status, payment_method, paid_at, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'cash_entry')
       RETURNING id`,
      [
        cid,
        transactionType,
        toDateOnly(occurredAt.toISOString()),
        description.trim(),
        entry_type === 'inflow' ? 'Caixa' : 'Despesa',
        Number(amount),
        status,
        payment_method ?? 'other',
        entry_type === 'inflow' ? occurredAt.toISOString() : null,
      ]
    );
    const transactionId = transactionRes.rows[0]?.id;

    const cashEntryRes = await client.query(
      `INSERT INTO public.cash_entries
        (company_id, transaction_id, entry_type, amount, payment_method, description, occurred_at, created_by, reference_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual')
       RETURNING id, transaction_id, entry_type, amount, payment_method, description, occurred_at`,
      [
        cid,
        transactionId ?? null,
        entry_type,
        Number(amount),
        payment_method ?? 'other',
        description.trim(),
        occurredAt.toISOString(),
        req.userId ?? null,
      ]
    );
    await client.query('COMMIT');
    const row = cashEntryRes.rows[0];
    res.status(201).json({
      id: row.id,
      transaction_id: row.transaction_id,
      entry_type: row.entry_type,
      amount: Number(row.amount),
      payment_method: row.payment_method,
      description: row.description,
      occurred_at: row.occurred_at,
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('createCashEntry:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar lançamento de caixa.');
  } finally {
    client.release();
  }
}

export async function getPendingAppointmentPayments(req: AuthReq, res: Response) {
  try {
    const cid = ensureCompanyId(req, res);
    if (!cid) return;
    const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
    if (!moduleOk) return;
    const { limit, offset, q, order } = listParams(req);

    const { rows } = await pool.query(
      `SELECT
         a.id,
         a.scheduled_at,
         a.status,
         c.name AS client_name,
         p.name AS pet_name,
         s.name AS service_name,
         s.price::float AS service_price,
         COALESCE(SUM(CASE WHEN t.type = 'revenue' AND t.status = 'paid' THEN t.value ELSE 0 END), 0)::float AS paid_total
       FROM public.appointments a
       JOIN public.clients c ON c.id = a.client_id
       JOIN public.pets p ON p.id = a.pet_id
       JOIN public.services s ON s.id = a.service_id
       LEFT JOIN public.transactions t
         ON t.company_id = a.company_id
        AND t.reference_type = 'appointment'
        AND t.reference_id = a.id
       WHERE a.company_id = $1
         AND a.status <> 'cancelled'
         AND (
           $2 = '' OR
           c.name ILIKE '%' || $2 || '%' OR
           p.name ILIKE '%' || $2 || '%' OR
           s.name ILIKE '%' || $2 || '%'
         )
       GROUP BY a.id, a.scheduled_at, a.status, c.name, p.name, s.name, s.price
       HAVING COALESCE(SUM(CASE WHEN t.type = 'revenue' AND t.status = 'paid' THEN t.value ELSE 0 END), 0)::float < s.price::float
       ORDER BY a.scheduled_at ${order}
       LIMIT $3 OFFSET $4`,
      [cid, q, limit, offset]
    );

    res.json(
      rows.map((r: Record<string, unknown>) => {
        const total = Number(r.service_price ?? 0);
        const paid = Number(r.paid_total ?? 0);
        return {
          id: r.id,
          scheduled_at: r.scheduled_at,
          status: r.status,
          client_name: r.client_name,
          pet_name: r.pet_name,
          service_name: r.service_name,
          service_price: total,
          paid_total: paid,
          remaining: Number((total - paid).toFixed(2)),
        };
      })
    );
  } catch (e) {
    console.error('getPendingAppointmentPayments:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao listar pagamentos pendentes.');
  }
}

export async function payAppointment(req: AuthReq, res: Response) {
  const cid = ensureCompanyId(req, res);
  if (!cid) return;
  const moduleOk = await assertPlanModuleAccess(res, cid, 'financial', 'Financeiro');
  if (!moduleOk) return;
  const appointmentId = req.params.id;

  const parsed = parseWithSchema(res, appointmentPaymentPayloadSchema, req.body ?? {});
  if (!parsed) return;
  const { amount, payment_method, paid_at, description } = parsed;
  const paidAt = paid_at ? new Date(paid_at) : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Data/hora inválida.', 'paid_at');
  }

  const appointmentRes = await pool.query(
    `SELECT
       a.id,
       a.scheduled_at,
       a.status,
       c.name AS client_name,
       p.name AS pet_name,
       s.name AS service_name,
       s.price::float AS service_price
     FROM public.appointments a
     JOIN public.clients c ON c.id = a.client_id
     JOIN public.pets p ON p.id = a.pet_id
     JOIN public.services s ON s.id = a.service_id
     WHERE a.id = $1
       AND a.company_id = $2
     LIMIT 1`,
    [appointmentId, cid]
  );
  const appointment = appointmentRes.rows[0];
  if (!appointment) return sendError(res, 404, 'NOT_FOUND', 'Agendamento não encontrado.');
  if (appointment.status === 'cancelled') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Agendamento cancelado não pode ser pago.', 'status');
  }

  const paidTotalsRes = await pool.query(
    `SELECT COALESCE(SUM(value), 0)::float AS total
     FROM public.transactions
     WHERE company_id = $1
       AND reference_type = 'appointment'
       AND reference_id = $2
       AND type = 'revenue'
       AND status = 'paid'`,
    [cid, appointmentId]
  );
  const paidTotal = Number(paidTotalsRes.rows[0]?.total ?? 0);
  const servicePrice = Number(appointment.service_price ?? 0);
  const remaining = Number((servicePrice - paidTotal).toFixed(2));
  if (remaining <= 0) return sendError(res, 409, 'CONFLICT', 'Agendamento já está quitado.');

  const amountToPay = Number((amount ?? remaining).toFixed(2));
  if (amountToPay <= 0 || amountToPay > remaining) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Valor de pagamento inválido.', 'amount');
  }

  const transactionDescription =
    description?.trim() || `Pagamento agendamento - ${appointment.service_name} (${appointment.pet_name})`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const transactionRes = await client.query(
      `INSERT INTO public.transactions
        (company_id, type, date, description, category, value, status, payment_method, paid_at, reference_type, reference_id)
       VALUES ($1, 'revenue', $2, $3, 'Serviço', $4, 'paid', $5, $6, 'appointment', $7)
       RETURNING id`,
      [
        cid,
        toDateOnly(paidAt.toISOString()),
        transactionDescription,
        amountToPay,
        payment_method ?? 'pix',
        paidAt.toISOString(),
        appointmentId,
      ]
    );
    const transactionId = transactionRes.rows[0]?.id;

    await client.query(
      `INSERT INTO public.cash_entries
        (company_id, transaction_id, entry_type, amount, payment_method, description, occurred_at, created_by, reference_type, reference_id)
       VALUES ($1, $2, 'inflow', $3, $4, $5, $6, $7, 'appointment', $8)`,
      [
        cid,
        transactionId ?? null,
        amountToPay,
        payment_method ?? 'pix',
        transactionDescription,
        paidAt.toISOString(),
        req.userId ?? null,
        appointmentId,
      ]
    );
    await client.query('COMMIT');

    const newPaidTotal = Number((paidTotal + amountToPay).toFixed(2));
    res.status(201).json({
      appointment_id: appointmentId,
      transaction_id: transactionId,
      amount: amountToPay,
      payment_method: payment_method ?? 'pix',
      paid_total: newPaidTotal,
      remaining: Number(Math.max(0, servicePrice - newPaidTotal).toFixed(2)),
      payment_status: newPaidTotal >= servicePrice ? 'paid' : 'partial',
      service_price: servicePrice,
      client_name: appointment.client_name,
      pet_name: appointment.pet_name,
      service_name: appointment.service_name,
    });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('payAppointment:', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao registrar pagamento.');
  } finally {
    client.release();
  }
}
