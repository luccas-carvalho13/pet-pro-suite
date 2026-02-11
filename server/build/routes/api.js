import { pool } from '../db.js';
const companyId = (req) => req.companyId;
export async function dashboardStats(req, res) {
    try {
        const cid = companyId(req);
        if (!cid) {
            return res.json({ stats: [], upcomingAppointments: [], lowStockItems: [] });
        }
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
        const [clientsCount, appointmentsToday, appointmentsList, lowStock, revenues] = await Promise.all([
            pool.query('SELECT COUNT(*)::int AS c FROM public.clients WHERE company_id = $1', [cid]),
            pool.query(`SELECT COUNT(*)::int AS c FROM public.appointments WHERE company_id = $1 AND scheduled_at::date = $2`, [cid, today]),
            pool.query(`SELECT a.scheduled_at, c.name AS client_name, p.name AS pet_name, s.name AS service_name
         FROM public.appointments a
         JOIN public.clients c ON c.id = a.client_id
         JOIN public.pets p ON p.id = a.pet_id
         JOIN public.services s ON s.id = a.service_id
         WHERE a.company_id = $1 AND a.scheduled_at::date = $2 AND a.status != 'cancelled'
         ORDER BY a.scheduled_at LIMIT 8`, [cid, today]),
            pool.query(`SELECT name, stock, min_stock FROM public.products WHERE company_id = $1 AND stock <= min_stock LIMIT 5`, [cid]),
            pool.query(`SELECT COALESCE(SUM(value),0)::float AS total FROM public.transactions WHERE company_id = $1 AND type = 'revenue' AND date >= $2`, [cid, new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)]),
        ]);
        const stats = [
            { title: 'Consultas Hoje', value: String(appointmentsToday.rows[0]?.c ?? 0), change: '', icon: 'Calendar' },
            { title: 'Clientes Ativos', value: String(clientsCount.rows[0]?.c ?? 0), change: '', icon: 'Users' },
            { title: 'Faturamento Mensal', value: `R$ ${Number(revenues.rows[0]?.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '', icon: 'DollarSign' },
            { title: 'Estoque Baixo', value: String(lowStock.rows.length), change: '', icon: 'Package' },
        ];
        const upcomingAppointments = (appointmentsList.rows || []).map((r) => ({
            time: new Date(r.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            client: r.client_name,
            pet: r.pet_name,
            service: r.service_name,
        }));
        const lowStockItems = (lowStock.rows || []).map((r) => ({
            name: r.name,
            quantity: r.stock,
            min: r.min_stock,
        }));
        res.json({ stats, upcomingAppointments, lowStockItems });
    }
    catch (e) {
        console.error('dashboardStats:', e);
        res.status(500).json({ error: 'Erro ao carregar dashboard.' });
    }
}
export async function getClients(req, res) {
    try {
        const cid = companyId(req);
        if (!cid)
            return res.json([]);
        const { rows } = await pool.query(`SELECT c.id, c.name, c.email, c.phone, c.address, c.created_at,
        (SELECT COUNT(*)::int FROM public.pets WHERE client_id = c.id) AS pets_count
       FROM public.clients c WHERE c.company_id = $1 ORDER BY c.name`, [cid]);
        const clients = rows.map((r) => ({
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
    }
    catch (e) {
        console.error('getClients:', e);
        res.status(500).json({ error: 'Erro ao listar clientes.' });
    }
}
export async function getPets(req, res) {
    try {
        const cid = companyId(req);
        if (!cid)
            return res.json([]);
        const { rows } = await pool.query(`SELECT p.id, p.client_id, p.name, p.species, p.breed, p.birth_date, c.name AS owner_name, p.created_at
       FROM public.pets p
       JOIN public.clients c ON c.id = p.client_id
       WHERE p.company_id = $1 ORDER BY p.name`, [cid]);
        const pets = rows.map((r) => ({
            id: r.id,
            client_id: r.client_id,
            name: r.name,
            species: r.species,
            breed: r.breed ?? '',
            birth_date: r.birth_date ?? null,
            age: r.birth_date ? `${Math.floor((Date.now() - new Date(r.birth_date).getTime()) / 31536e6)} anos` : '',
            owner: r.owner_name,
            lastVisit: r.created_at,
            status: 'healthy',
        }));
        res.json(pets);
    }
    catch (e) {
        console.error('getPets:', e);
        res.status(500).json({ error: 'Erro ao listar pets.' });
    }
}
export async function getServices(req, res) {
    try {
        const cid = companyId(req);
        if (!cid)
            return res.json([]);
        const { rows } = await pool.query(`SELECT id, name, category, duration_minutes, price, commission_pct FROM public.services WHERE company_id = $1 ORDER BY name`, [cid]);
        const services = rows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            duration: `${r.duration_minutes} min`,
            price: Number(r.price),
            commission: r.commission_pct != null ? Number(r.commission_pct) : 0,
        }));
        res.json(services);
    }
    catch (e) {
        console.error('getServices:', e);
        res.status(500).json({ error: 'Erro ao listar serviços.' });
    }
}
export async function getProducts(req, res) {
    try {
        const cid = companyId(req);
        if (!cid)
            return res.json([]);
        const { rows } = await pool.query(`SELECT id, name, category, stock, min_stock, price FROM public.products WHERE company_id = $1 ORDER BY name`, [cid]);
        const products = rows.map((r) => {
            const stock = Number(r.stock);
            const min = Number(r.min_stock);
            let status = 'normal';
            if (stock < min * 0.5)
                status = 'critical';
            else if (stock <= min)
                status = 'low';
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
    }
    catch (e) {
        console.error('getProducts:', e);
        res.status(500).json({ error: 'Erro ao listar produtos.' });
    }
}
export async function getAppointments(req, res) {
    try {
        const cid = companyId(req);
        if (!cid)
            return res.json([]);
        const { rows } = await pool.query(`SELECT a.id, a.client_id, a.pet_id, a.service_id, a.scheduled_at, a.duration_minutes, a.status, a.vet_name,
        c.name AS client_name, p.name AS pet_name, p.species AS pet_species, s.name AS service_name
       FROM public.appointments a
       JOIN public.clients c ON c.id = a.client_id
       JOIN public.pets p ON p.id = a.pet_id
       JOIN public.services s ON s.id = a.service_id
       WHERE a.company_id = $1 AND a.scheduled_at::date >= CURRENT_DATE
       ORDER BY a.scheduled_at`, [cid]);
        const appointments = rows.map((r) => ({
            id: r.id,
            client_id: r.client_id,
            pet_id: r.pet_id,
            service_id: r.service_id,
            scheduledAt: r.scheduled_at,
            time: new Date(r.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            duration: `${r.duration_minutes} min`,
            client: r.client_name,
            pet: r.pet_name,
            petType: r.pet_species === 'Cão' ? 'Cachorro' : r.pet_species,
            service: r.service_name,
            status: r.status === 'scheduled' ? 'pending' : r.status === 'in_progress' ? 'in-progress' : r.status === 'confirmed' ? 'confirmed' : r.status,
            vet: r.vet_name ?? '',
        }));
        res.json(appointments);
    }
    catch (e) {
        console.error('getAppointments:', e);
        res.status(500).json({ error: 'Erro ao listar agendamentos.' });
    }
}
export async function getCompanies(req, res) {
    try {
        if (req.isSuperAdmin) {
            const { rows } = await pool.query(`SELECT c.id, c.name, c.status, c.created_at, c.current_plan_id, p.name AS plan_name,
          (SELECT COUNT(*)::int FROM public.profiles WHERE company_id = c.id) AS users_count
         FROM public.companies c
         LEFT JOIN public.plans p ON p.id = c.current_plan_id
         ORDER BY c.name`);
            const companies = rows.map((r) => ({
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
        if (!cid)
            return res.json([]);
        const { rows } = await pool.query(`SELECT c.id, c.name, c.status, c.created_at, c.current_plan_id, p.name AS plan_name,
        (SELECT COUNT(*)::int FROM public.profiles WHERE company_id = c.id) AS users_count
       FROM public.companies c
       LEFT JOIN public.plans p ON p.id = c.current_plan_id
       WHERE c.id = $1`, [cid]);
        res.json(rows.map((r) => ({
            id: r.id,
            name: r.name,
            plan: r.plan_name ?? '–',
            plan_id: r.current_plan_id,
            users: r.users_count ?? 0,
            status: r.status,
            mrr: 0,
            created: r.created_at,
        })));
    }
    catch (e) {
        console.error('getCompanies:', e);
        res.status(500).json({ error: 'Erro ao listar empresas.' });
    }
}
export async function getTransactions(req, res) {
    try {
        const cid = companyId(req);
        if (!cid)
            return res.json({ revenues: [], expenses: [], stats: [] });
        const type = req.query.type || 'all';
        const [revenues, expenses, totals] = await Promise.all([
            type === 'expense' ? { rows: [] } : pool.query("SELECT id, date, description, value, status FROM public.transactions WHERE company_id = $1 AND type = 'revenue' ORDER BY date DESC", [cid]),
            type === 'revenue' ? { rows: [] } : pool.query("SELECT id, date, description, category, value FROM public.transactions WHERE company_id = $1 AND type = 'expense' ORDER BY date DESC", [cid]),
            pool.query(`SELECT
          COALESCE(SUM(CASE WHEN type = 'revenue' THEN value ELSE 0 END),0)::float AS rev,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END),0)::float AS exp
         FROM public.transactions WHERE company_id = $1 AND date >= date_trunc('month', CURRENT_DATE)::date`, [cid]),
        ]);
        const revTotal = Number(totals.rows[0]?.rev ?? 0);
        const expTotal = Number(totals.rows[0]?.exp ?? 0);
        const revenuesList = (revenues.rows || []).map((r) => ({
            id: r.id,
            date: r.date,
            description: r.description,
            type: 'Serviço',
            value: Number(r.value),
            status: r.status ?? 'paid',
        }));
        const expensesList = (expenses.rows || []).map((r) => ({
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
    }
    catch (e) {
        console.error('getTransactions:', e);
        res.status(500).json({ error: 'Erro ao listar transações.' });
    }
}
export async function getCompanySettings(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
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
    }
    catch (e) {
        console.error('getCompanySettings:', e);
        res.status(500).json({ error: 'Erro ao carregar configurações.' });
    }
}
export async function updateCompanySettings(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { name, cnpj, phone, address, contact_email, website, hours } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
        await pool.query(`UPDATE public.companies SET name = $1, cnpj = $2, phone = $3, address = $4 WHERE id = $5`, [name.trim(), cnpj?.trim() || null, phone?.trim() || null, address?.trim() || null, cid]);
        await pool.query(`INSERT INTO public.company_settings (company_id, contact_email, website, hours)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id) DO UPDATE SET
         contact_email = EXCLUDED.contact_email,
         website = EXCLUDED.website,
         hours = EXCLUDED.hours`, [cid, contact_email?.trim() || null, website?.trim() || null, hours?.trim() || null]);
        res.json({ ok: true });
    }
    catch (e) {
        console.error('updateCompanySettings:', e);
        res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
}
export async function getNotificationSettings(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { rows } = await pool.query(`SELECT reminders, low_stock, payment_receipt, pet_birthday
       FROM public.notification_settings WHERE company_id = $1`, [cid]);
        const s = rows[0] ?? {};
        res.json({
            reminders: s.reminders ?? true,
            low_stock: s.low_stock ?? true,
            payment_receipt: s.payment_receipt ?? true,
            pet_birthday: s.pet_birthday ?? false,
        });
    }
    catch (e) {
        console.error('getNotificationSettings:', e);
        res.status(500).json({ error: 'Erro ao carregar notificações.' });
    }
}
export async function updateNotificationSettings(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { reminders, low_stock, payment_receipt, pet_birthday } = req.body;
        await pool.query(`INSERT INTO public.notification_settings (company_id, reminders, low_stock, payment_receipt, pet_birthday)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (company_id) DO UPDATE SET
         reminders = EXCLUDED.reminders,
         low_stock = EXCLUDED.low_stock,
         payment_receipt = EXCLUDED.payment_receipt,
         pet_birthday = EXCLUDED.pet_birthday`, [cid, !!reminders, !!low_stock, !!payment_receipt, !!pet_birthday]);
        res.json({ ok: true });
    }
    catch (e) {
        console.error('updateNotificationSettings:', e);
        res.status(500).json({ error: 'Erro ao salvar notificações.' });
    }
}
export async function getAppearanceSettings(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { rows } = await pool.query(`SELECT theme, primary_color, logo_url FROM public.appearance_settings WHERE company_id = $1`, [cid]);
        const s = rows[0] ?? {};
        res.json({
            theme: s.theme ?? 'light',
            primary_color: s.primary_color ?? 'petpro',
            logo_url: s.logo_url ?? '',
        });
    }
    catch (e) {
        console.error('getAppearanceSettings:', e);
        res.status(500).json({ error: 'Erro ao carregar aparência.' });
    }
}
export async function updateAppearanceSettings(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { theme, primary_color, logo_url } = req.body;
        await pool.query(`INSERT INTO public.appearance_settings (company_id, theme, primary_color, logo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id) DO UPDATE SET
         theme = EXCLUDED.theme,
         primary_color = EXCLUDED.primary_color,
         logo_url = EXCLUDED.logo_url`, [cid, theme ?? 'light', primary_color ?? 'petpro', logo_url?.trim() || null]);
        res.json({ ok: true });
    }
    catch (e) {
        console.error('updateAppearanceSettings:', e);
        res.status(500).json({ error: 'Erro ao salvar aparência.' });
    }
}
export async function getUserSecuritySettings(req, res) {
    try {
        if (!req.userId)
            return res.status(401).json({ error: 'Não autenticado.' });
        const { rows } = await pool.query(`SELECT two_factor_enabled FROM public.user_security_settings WHERE user_id = $1`, [req.userId]);
        const s = rows[0] ?? {};
        res.json({ two_factor_enabled: s.two_factor_enabled ?? false });
    }
    catch (e) {
        console.error('getUserSecuritySettings:', e);
        res.status(500).json({ error: 'Erro ao carregar segurança.' });
    }
}
export async function updateUserSecuritySettings(req, res) {
    try {
        if (!req.userId)
            return res.status(401).json({ error: 'Não autenticado.' });
        const { two_factor_enabled } = req.body;
        await pool.query(`INSERT INTO public.user_security_settings (user_id, two_factor_enabled)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET two_factor_enabled = EXCLUDED.two_factor_enabled`, [req.userId, !!two_factor_enabled]);
        res.json({ ok: true });
    }
    catch (e) {
        console.error('updateUserSecuritySettings:', e);
        res.status(500).json({ error: 'Erro ao salvar segurança.' });
    }
}
export async function getCompanyUsers(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { rows } = await pool.query(`SELECT p.id, p.full_name, p.email, r.role
       FROM public.profiles p
       LEFT JOIN public.user_roles r ON r.user_id = p.id AND r.company_id = $1
       WHERE p.company_id = $1
       ORDER BY p.full_name`, [cid]);
        res.json(rows.map((r) => ({
            id: r.id,
            name: r.full_name,
            email: r.email,
            role: r.role ?? 'usuario',
        })));
    }
    catch (e) {
        console.error('getCompanyUsers:', e);
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
}
export async function updateCompanyUserRole(req, res) {
    try {
        if (!req.isAdmin)
            return res.status(403).json({ error: 'Acesso restrito a administradores.' });
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const userId = req.params.id;
        const { role } = req.body;
        if (!role)
            return res.status(400).json({ error: 'Role é obrigatória.' });
        const allowed = ['superadmin', 'admin', 'supervisor', 'atendente', 'usuario'];
        if (!allowed.includes(role))
            return res.status(400).json({ error: 'Role inválida.' });
        await pool.query(`DELETE FROM public.user_roles WHERE user_id = $1 AND company_id = $2`, [userId, cid]);
        await pool.query(`INSERT INTO public.user_roles (user_id, role, company_id) VALUES ($1, $2, $3)`, [userId, role, cid]);
        res.json({ ok: true });
    }
    catch (e) {
        console.error('updateCompanyUserRole:', e);
        res.status(500).json({ error: 'Erro ao atualizar role.' });
    }
}
function toCsv(headers, rows) {
    const escape = (v) => {
        const s = v == null ? '' : String(v);
        if (s.includes('"') || s.includes(',') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}
export async function exportReport(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const type = req.query.type || 'clients';
        let csv = '';
        let filename = `${type}.csv`;
        if (type === 'clients') {
            const { rows } = await pool.query(`SELECT name, email, phone, address, created_at FROM public.clients WHERE company_id = $1 ORDER BY name`, [cid]);
            csv = toCsv(['Nome', 'Email', 'Telefone', 'Endereço', 'Criado em'], rows.map((r) => [
                r.name, r.email, r.phone, r.address, r.created_at,
            ]));
            filename = 'clientes.csv';
        }
        else if (type === 'financial') {
            const { rows } = await pool.query(`SELECT type, date, description, category, value, status FROM public.transactions WHERE company_id = $1 ORDER BY date DESC`, [cid]);
            csv = toCsv(['Tipo', 'Data', 'Descrição', 'Categoria', 'Valor', 'Status'], rows.map((r) => [
                r.type, r.date, r.description, r.category, r.value, r.status,
            ]));
            filename = 'financeiro.csv';
        }
        else if (type === 'inventory') {
            const { rows } = await pool.query(`SELECT name, category, stock, min_stock, price FROM public.products WHERE company_id = $1 ORDER BY name`, [cid]);
            csv = toCsv(['Produto', 'Categoria', 'Estoque', 'Mínimo', 'Preço'], rows.map((r) => [
                r.name, r.category, r.stock, r.min_stock, r.price,
            ]));
            filename = 'estoque.csv';
        }
        else if (type === 'services') {
            const { rows } = await pool.query(`SELECT name, category, duration_minutes, price, commission_pct FROM public.services WHERE company_id = $1 ORDER BY name`, [cid]);
            csv = toCsv(['Serviço', 'Categoria', 'Duração (min)', 'Preço', 'Comissão (%)'], rows.map((r) => [
                r.name, r.category, r.duration_minutes, r.price, r.commission_pct,
            ]));
            filename = 'servicos.csv';
        }
        else {
            return res.status(400).json({ error: 'Tipo de relatório inválido.' });
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
    catch (e) {
        console.error('exportReport:', e);
        res.status(500).json({ error: 'Erro ao exportar relatório.' });
    }
}
export async function getPlans(req, res) {
    try {
        if (!req.isSuperAdmin)
            return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
        const { rows } = await pool.query(`SELECT id, name, description, price, trial_days, max_users, max_pets, is_active FROM public.plans ORDER BY price ASC`);
        res.json(rows);
    }
    catch (e) {
        console.error('getPlans:', e);
        res.status(500).json({ error: 'Erro ao listar planos.' });
    }
}
export async function updatePlan(req, res) {
    try {
        if (!req.isSuperAdmin)
            return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
        const id = req.params.id;
        const { name, description, price, trial_days, max_users, max_pets, is_active } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        const { rows } = await pool.query(`UPDATE public.plans
       SET name = $1, description = $2, price = $3, trial_days = $4, max_users = $5, max_pets = $6, is_active = $7
       WHERE id = $8
       RETURNING id, name, description, price, trial_days, max_users, max_pets, is_active`, [name.trim(), description?.trim() || null, Number(price ?? 0), Number(trial_days ?? 0), max_users ?? null, max_pets ?? null, !!is_active, id]);
        if (!rows[0])
            return res.status(404).json({ error: 'Plano não encontrado.' });
        res.json(rows[0]);
    }
    catch (e) {
        console.error('updatePlan:', e);
        res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
}
export async function createCompany(req, res) {
    try {
        if (!req.isSuperAdmin)
            return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
        const { name, cnpj, phone, address, status, current_plan_id } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        const { rows } = await pool.query(`INSERT INTO public.companies (name, cnpj, phone, address, status, current_plan_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, status, created_at`, [name.trim(), cnpj?.trim() || null, phone?.trim() || null, address?.trim() || null, status ?? 'trial', current_plan_id ?? null]);
        res.status(201).json(rows[0]);
    }
    catch (e) {
        console.error('createCompany:', e);
        res.status(500).json({ error: 'Erro ao criar empresa.' });
    }
}
export async function updateCompany(req, res) {
    try {
        if (!req.isSuperAdmin)
            return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
        const id = req.params.id;
        const { name, cnpj, phone, address, status, current_plan_id } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        const { rows } = await pool.query(`UPDATE public.companies
       SET name = $1, cnpj = $2, phone = $3, address = $4, status = $5, current_plan_id = $6
       WHERE id = $7
       RETURNING id, name, status, created_at`, [name.trim(), cnpj?.trim() || null, phone?.trim() || null, address?.trim() || null, status ?? 'trial', current_plan_id ?? null, id]);
        if (!rows[0])
            return res.status(404).json({ error: 'Empresa não encontrada.' });
        res.json(rows[0]);
    }
    catch (e) {
        console.error('updateCompany:', e);
        res.status(500).json({ error: 'Erro ao atualizar empresa.' });
    }
}
export async function exportCompanies(req, res) {
    try {
        if (!req.isSuperAdmin)
            return res.status(403).json({ error: 'Acesso restrito a superadmin.' });
        const { rows } = await pool.query(`SELECT name, status, created_at FROM public.companies ORDER BY name`);
        const csv = toCsv(['Empresa', 'Status', 'Criado em'], rows.map((r) => [r.name, r.status, r.created_at]));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="empresas.csv"`);
        res.send(csv);
    }
    catch (e) {
        console.error('exportCompanies:', e);
        res.status(500).json({ error: 'Erro ao exportar empresas.' });
    }
}
function ensureCompanyId(req, res) {
    const cid = companyId(req);
    if (!cid) {
        res.status(403).json({ error: 'Usuário não está vinculado a nenhuma empresa.' });
        return null;
    }
    return cid;
}
async function ensureCompanyRow(table, id, companyIdVal) {
    const { rows } = await pool.query(`SELECT id FROM public.${table} WHERE id = $1 AND company_id = $2`, [id, companyIdVal]);
    return rows.length > 0;
}
export async function createClient(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { name, email, phone, address } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        const { rows } = await pool.query(`INSERT INTO public.clients (company_id, name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, address, created_at`, [cid, name.trim(), email?.trim() || null, phone?.trim() || null, address?.trim() || null]);
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
    }
    catch (e) {
        console.error('createClient:', e);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
}
export async function updateClient(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { name, email, phone, address } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        const { rows } = await pool.query(`UPDATE public.clients
       SET name = $1, email = $2, phone = $3, address = $4
       WHERE id = $5 AND company_id = $6
       RETURNING id, name, email, phone, address, created_at`, [name.trim(), email?.trim() || null, phone?.trim() || null, address?.trim() || null, id, cid]);
        if (!rows[0])
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        const c = rows[0];
        const petsCount = await pool.query(`SELECT COUNT(*)::int AS c FROM public.pets WHERE client_id = $1`, [c.id]);
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
    }
    catch (e) {
        console.error('updateClient:', e);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
}
export async function deleteClient(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { rowCount } = await pool.query(`DELETE FROM public.clients WHERE id = $1 AND company_id = $2`, [id, cid]);
        if (!rowCount)
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('deleteClient:', e);
        res.status(500).json({ error: 'Erro ao remover cliente.' });
    }
}
export async function createPet(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { client_id, name, species, breed, birth_date } = req.body;
        if (!client_id)
            return res.status(400).json({ error: 'Tutor é obrigatório.' });
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome do pet é obrigatório.' });
        if (!species?.trim())
            return res.status(400).json({ error: 'Espécie é obrigatória.' });
        const clientOk = await ensureCompanyRow('clients', client_id, cid);
        if (!clientOk)
            return res.status(400).json({ error: 'Tutor inválido.' });
        const { rows } = await pool.query(`INSERT INTO public.pets (company_id, client_id, name, species, breed, birth_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, species, breed, birth_date, created_at`, [cid, client_id, name.trim(), species.trim(), breed?.trim() || null, birth_date || null]);
        const owner = await pool.query(`SELECT name FROM public.clients WHERE id = $1`, [client_id]);
        const p = rows[0];
        res.status(201).json({
            id: p.id,
            client_id,
            name: p.name,
            species: p.species,
            breed: p.breed ?? '',
            birth_date: p.birth_date ?? null,
            age: p.birth_date ? `${Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31536e6)} anos` : '',
            owner: owner.rows[0]?.name ?? '',
            lastVisit: p.created_at,
            status: 'healthy',
        });
    }
    catch (e) {
        console.error('createPet:', e);
        res.status(500).json({ error: 'Erro ao criar pet.' });
    }
}
export async function updatePet(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { client_id, name, species, breed, birth_date } = req.body;
        if (!client_id)
            return res.status(400).json({ error: 'Tutor é obrigatório.' });
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome do pet é obrigatório.' });
        if (!species?.trim())
            return res.status(400).json({ error: 'Espécie é obrigatória.' });
        const clientOk = await ensureCompanyRow('clients', client_id, cid);
        if (!clientOk)
            return res.status(400).json({ error: 'Tutor inválido.' });
        const { rows } = await pool.query(`UPDATE public.pets
       SET client_id = $1, name = $2, species = $3, breed = $4, birth_date = $5
       WHERE id = $6 AND company_id = $7
       RETURNING id, name, species, breed, birth_date, created_at`, [client_id, name.trim(), species.trim(), breed?.trim() || null, birth_date || null, id, cid]);
        if (!rows[0])
            return res.status(404).json({ error: 'Pet não encontrado.' });
        const owner = await pool.query(`SELECT name FROM public.clients WHERE id = $1`, [client_id]);
        const p = rows[0];
        res.json({
            id: p.id,
            client_id,
            name: p.name,
            species: p.species,
            breed: p.breed ?? '',
            birth_date: p.birth_date ?? null,
            age: p.birth_date ? `${Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31536e6)} anos` : '',
            owner: owner.rows[0]?.name ?? '',
            lastVisit: p.created_at,
            status: 'healthy',
        });
    }
    catch (e) {
        console.error('updatePet:', e);
        res.status(500).json({ error: 'Erro ao atualizar pet.' });
    }
}
export async function deletePet(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { rowCount } = await pool.query(`DELETE FROM public.pets WHERE id = $1 AND company_id = $2`, [id, cid]);
        if (!rowCount)
            return res.status(404).json({ error: 'Pet não encontrado.' });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('deletePet:', e);
        res.status(500).json({ error: 'Erro ao remover pet.' });
    }
}
export async function createService(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { name, category, duration_minutes, price, commission_pct } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        if (!category?.trim())
            return res.status(400).json({ error: 'Categoria é obrigatória.' });
        if (!price && price !== 0)
            return res.status(400).json({ error: 'Preço é obrigatório.' });
        const { rows } = await pool.query(`INSERT INTO public.services (company_id, name, category, duration_minutes, price, commission_pct)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, category, duration_minutes, price, commission_pct`, [cid, name.trim(), category.trim(), Number(duration_minutes ?? 30), Number(price), commission_pct ?? null]);
        const s = rows[0];
        res.status(201).json({
            id: s.id,
            name: s.name,
            category: s.category,
            duration: `${s.duration_minutes} min`,
            price: Number(s.price),
            commission: s.commission_pct != null ? Number(s.commission_pct) : 0,
        });
    }
    catch (e) {
        console.error('createService:', e);
        res.status(500).json({ error: 'Erro ao criar serviço.' });
    }
}
export async function updateService(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { name, category, duration_minutes, price, commission_pct } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        if (!category?.trim())
            return res.status(400).json({ error: 'Categoria é obrigatória.' });
        if (!price && price !== 0)
            return res.status(400).json({ error: 'Preço é obrigatório.' });
        const { rows } = await pool.query(`UPDATE public.services
       SET name = $1, category = $2, duration_minutes = $3, price = $4, commission_pct = $5
       WHERE id = $6 AND company_id = $7
       RETURNING id, name, category, duration_minutes, price, commission_pct`, [name.trim(), category.trim(), Number(duration_minutes ?? 30), Number(price), commission_pct ?? null, id, cid]);
        if (!rows[0])
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        const s = rows[0];
        res.json({
            id: s.id,
            name: s.name,
            category: s.category,
            duration: `${s.duration_minutes} min`,
            price: Number(s.price),
            commission: s.commission_pct != null ? Number(s.commission_pct) : 0,
        });
    }
    catch (e) {
        console.error('updateService:', e);
        res.status(500).json({ error: 'Erro ao atualizar serviço.' });
    }
}
export async function deleteService(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { rowCount } = await pool.query(`DELETE FROM public.services WHERE id = $1 AND company_id = $2`, [id, cid]);
        if (!rowCount)
            return res.status(404).json({ error: 'Serviço não encontrado.' });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('deleteService:', e);
        res.status(500).json({ error: 'Erro ao remover serviço.' });
    }
}
export async function createProduct(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { name, category, stock, min_stock, price, unit } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        if (!category?.trim())
            return res.status(400).json({ error: 'Categoria é obrigatória.' });
        if (!price && price !== 0)
            return res.status(400).json({ error: 'Preço é obrigatório.' });
        const { rows } = await pool.query(`INSERT INTO public.products (company_id, name, category, stock, min_stock, price, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, category, stock, min_stock, price`, [cid, name.trim(), category.trim(), Number(stock ?? 0), Number(min_stock ?? 0), Number(price), unit?.trim() || 'un']);
        const p = rows[0];
        let status = 'normal';
        if (Number(p.stock) < Number(p.min_stock) * 0.5)
            status = 'critical';
        else if (Number(p.stock) <= Number(p.min_stock))
            status = 'low';
        res.status(201).json({
            id: p.id,
            name: p.name,
            category: p.category,
            stock: Number(p.stock),
            minStock: Number(p.min_stock),
            price: Number(p.price),
            status,
        });
    }
    catch (e) {
        console.error('createProduct:', e);
        res.status(500).json({ error: 'Erro ao criar produto.' });
    }
}
export async function updateProduct(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { name, category, stock, min_stock, price, unit } = req.body;
        if (!name?.trim())
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        if (!category?.trim())
            return res.status(400).json({ error: 'Categoria é obrigatória.' });
        if (!price && price !== 0)
            return res.status(400).json({ error: 'Preço é obrigatório.' });
        const { rows } = await pool.query(`UPDATE public.products
       SET name = $1, category = $2, stock = $3, min_stock = $4, price = $5, unit = $6
       WHERE id = $7 AND company_id = $8
       RETURNING id, name, category, stock, min_stock, price`, [name.trim(), category.trim(), Number(stock ?? 0), Number(min_stock ?? 0), Number(price), unit?.trim() || 'un', id, cid]);
        if (!rows[0])
            return res.status(404).json({ error: 'Produto não encontrado.' });
        const p = rows[0];
        let status = 'normal';
        if (Number(p.stock) < Number(p.min_stock) * 0.5)
            status = 'critical';
        else if (Number(p.stock) <= Number(p.min_stock))
            status = 'low';
        res.json({
            id: p.id,
            name: p.name,
            category: p.category,
            stock: Number(p.stock),
            minStock: Number(p.min_stock),
            price: Number(p.price),
            status,
        });
    }
    catch (e) {
        console.error('updateProduct:', e);
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
}
export async function deleteProduct(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { rowCount } = await pool.query(`DELETE FROM public.products WHERE id = $1 AND company_id = $2`, [id, cid]);
        if (!rowCount)
            return res.status(404).json({ error: 'Produto não encontrado.' });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('deleteProduct:', e);
        res.status(500).json({ error: 'Erro ao remover produto.' });
    }
}
export async function createAppointment(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name, notes } = req.body;
        if (!client_id || !pet_id || !service_id) {
            return res.status(400).json({ error: 'Cliente, pet e serviço são obrigatórios.' });
        }
        if (!scheduled_at)
            return res.status(400).json({ error: 'Data/hora é obrigatória.' });
        const clientOk = await ensureCompanyRow('clients', client_id, cid);
        const petOk = await ensureCompanyRow('pets', pet_id, cid);
        const serviceOk = await ensureCompanyRow('services', service_id, cid);
        if (!clientOk || !petOk || !serviceOk) {
            return res.status(400).json({ error: 'Dados inválidos para o agendamento.' });
        }
        const petOwner = await pool.query(`SELECT client_id FROM public.pets WHERE id = $1`, [pet_id]);
        if (petOwner.rows[0]?.client_id !== client_id) {
            return res.status(400).json({ error: 'Pet não pertence ao cliente informado.' });
        }
        const { rows } = await pool.query(`INSERT INTO public.appointments (company_id, client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, scheduled_at, duration_minutes, status, vet_name`, [cid, client_id, pet_id, service_id, scheduled_at, Number(duration_minutes ?? 30), status ?? 'scheduled', vet_name?.trim() || null, notes?.trim() || null]);
        const joined = await pool.query(`SELECT c.name AS client_name, p.name AS pet_name, p.species AS pet_species, s.name AS service_name
       FROM public.clients c
       JOIN public.pets p ON p.id = $1
       JOIN public.services s ON s.id = $2
       WHERE c.id = $3`, [pet_id, service_id, client_id]);
        const meta = joined.rows[0];
        const a = rows[0];
        res.status(201).json({
            id: a.id,
            client_id,
            pet_id,
            service_id,
            scheduledAt: a.scheduled_at,
            time: new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            duration: `${a.duration_minutes} min`,
            client: meta?.client_name ?? '',
            pet: meta?.pet_name ?? '',
            petType: meta?.pet_species === 'Cão' ? 'Cachorro' : meta?.pet_species,
            service: meta?.service_name ?? '',
            status: a.status === 'scheduled' ? 'pending' : a.status === 'in_progress' ? 'in-progress' : a.status === 'confirmed' ? 'confirmed' : a.status,
            vet: a.vet_name ?? '',
        });
    }
    catch (e) {
        console.error('createAppointment:', e);
        res.status(500).json({ error: 'Erro ao criar agendamento.' });
    }
}
export async function updateAppointment(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { client_id, pet_id, service_id, scheduled_at, duration_minutes, status, vet_name, notes } = req.body;
        if (!client_id || !pet_id || !service_id) {
            return res.status(400).json({ error: 'Cliente, pet e serviço são obrigatórios.' });
        }
        if (!scheduled_at)
            return res.status(400).json({ error: 'Data/hora é obrigatória.' });
        const clientOk = await ensureCompanyRow('clients', client_id, cid);
        const petOk = await ensureCompanyRow('pets', pet_id, cid);
        const serviceOk = await ensureCompanyRow('services', service_id, cid);
        if (!clientOk || !petOk || !serviceOk) {
            return res.status(400).json({ error: 'Dados inválidos para o agendamento.' });
        }
        const petOwner = await pool.query(`SELECT client_id FROM public.pets WHERE id = $1`, [pet_id]);
        if (petOwner.rows[0]?.client_id !== client_id) {
            return res.status(400).json({ error: 'Pet não pertence ao cliente informado.' });
        }
        const { rows } = await pool.query(`UPDATE public.appointments
       SET client_id = $1, pet_id = $2, service_id = $3, scheduled_at = $4, duration_minutes = $5, status = $6, vet_name = $7, notes = $8
       WHERE id = $9 AND company_id = $10
       RETURNING id, scheduled_at, duration_minutes, status, vet_name`, [client_id, pet_id, service_id, scheduled_at, Number(duration_minutes ?? 30), status ?? 'scheduled', vet_name?.trim() || null, notes?.trim() || null, id, cid]);
        if (!rows[0])
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        const joined = await pool.query(`SELECT c.name AS client_name, p.name AS pet_name, p.species AS pet_species, s.name AS service_name
       FROM public.clients c
       JOIN public.pets p ON p.id = $1
       JOIN public.services s ON s.id = $2
       WHERE c.id = $3`, [pet_id, service_id, client_id]);
        const meta = joined.rows[0];
        const a = rows[0];
        res.json({
            id: a.id,
            client_id,
            pet_id,
            service_id,
            scheduledAt: a.scheduled_at,
            time: new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            duration: `${a.duration_minutes} min`,
            client: meta?.client_name ?? '',
            pet: meta?.pet_name ?? '',
            petType: meta?.pet_species === 'Cão' ? 'Cachorro' : meta?.pet_species,
            service: meta?.service_name ?? '',
            status: a.status === 'scheduled' ? 'pending' : a.status === 'in_progress' ? 'in-progress' : a.status === 'confirmed' ? 'confirmed' : a.status,
            vet: a.vet_name ?? '',
        });
    }
    catch (e) {
        console.error('updateAppointment:', e);
        res.status(500).json({ error: 'Erro ao atualizar agendamento.' });
    }
}
export async function deleteAppointment(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { rowCount } = await pool.query(`DELETE FROM public.appointments WHERE id = $1 AND company_id = $2`, [id, cid]);
        if (!rowCount)
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('deleteAppointment:', e);
        res.status(500).json({ error: 'Erro ao remover agendamento.' });
    }
}
export async function createTransaction(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const { type, date, description, category, value, status } = req.body;
        if (!type)
            return res.status(400).json({ error: 'Tipo é obrigatório.' });
        if (!date)
            return res.status(400).json({ error: 'Data é obrigatória.' });
        if (!description?.trim())
            return res.status(400).json({ error: 'Descrição é obrigatória.' });
        if (value === undefined || value === null)
            return res.status(400).json({ error: 'Valor é obrigatório.' });
        const { rows } = await pool.query(`INSERT INTO public.transactions (company_id, type, date, description, category, value, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, date, description, category, value, status`, [cid, type, date, description.trim(), category?.trim() || null, Number(value), status?.trim() || null]);
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
    }
    catch (e) {
        console.error('createTransaction:', e);
        res.status(500).json({ error: 'Erro ao criar transação.' });
    }
}
export async function updateTransaction(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { type, date, description, category, value, status } = req.body;
        if (!type)
            return res.status(400).json({ error: 'Tipo é obrigatório.' });
        if (!date)
            return res.status(400).json({ error: 'Data é obrigatória.' });
        if (!description?.trim())
            return res.status(400).json({ error: 'Descrição é obrigatória.' });
        if (value === undefined || value === null)
            return res.status(400).json({ error: 'Valor é obrigatório.' });
        const { rows } = await pool.query(`UPDATE public.transactions
       SET type = $1, date = $2, description = $3, category = $4, value = $5, status = $6
       WHERE id = $7 AND company_id = $8
       RETURNING id, date, description, category, value, status`, [type, date, description.trim(), category?.trim() || null, Number(value), status?.trim() || null, id, cid]);
        if (!rows[0])
            return res.status(404).json({ error: 'Transação não encontrada.' });
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
    }
    catch (e) {
        console.error('updateTransaction:', e);
        res.status(500).json({ error: 'Erro ao atualizar transação.' });
    }
}
export async function deleteTransaction(req, res) {
    try {
        const cid = ensureCompanyId(req, res);
        if (!cid)
            return;
        const id = req.params.id;
        const { rowCount } = await pool.query(`DELETE FROM public.transactions WHERE id = $1 AND company_id = $2`, [id, cid]);
        if (!rowCount)
            return res.status(404).json({ error: 'Transação não encontrada.' });
        res.json({ ok: true });
    }
    catch (e) {
        console.error('deleteTransaction:', e);
        res.status(500).json({ error: 'Erro ao remover transação.' });
    }
}
