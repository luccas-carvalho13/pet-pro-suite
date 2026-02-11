import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { logger } from './logger.js';
import { jwtSecret } from './config.js';
function createToken(userId) {
    return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logger.info('[login] 400: e-mail ou senha ausentes');
            res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
            return;
        }
        const emailNorm = email.trim().toLowerCase();
        const { rows } = await pool.query(`SELECT id, email, raw_user_meta_data, encrypted_password FROM auth.users WHERE LOWER(email) = $1`, [emailNorm]);
        if (rows.length === 0) {
            logger.info('[login] 401: usuário não encontrado', { email: emailNorm });
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.encrypted_password ?? '');
        if (!ok) {
            logger.info('[login] 401: senha incorreta', { email: emailNorm });
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }
        const token = createToken(user.id);
        let company = null;
        const prof = await pool.query('SELECT company_id FROM public.profiles WHERE id = $1', [user.id]);
        if (prof.rows[0]?.company_id) {
            const co = await pool.query('SELECT id, name FROM public.companies WHERE id = $1', [prof.rows[0].company_id]);
            if (co.rows[0])
                company = { id: co.rows[0].id, name: co.rows[0].name };
        }
        logger.info('[login] 200: login ok', { email: user.email, companyId: company?.id ?? null });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.raw_user_meta_data?.full_name ?? '',
            },
            company,
        });
    }
    catch (e) {
        logger.errorFull('[login] 500: erro ao fazer login', e);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
}
export async function checkEmail(req, res) {
    try {
        const email = req.query.email?.trim()?.toLowerCase();
        if (!email) {
            res.status(400).json({ available: false, error: 'E-mail é obrigatório.' });
            return;
        }
        const { rows } = await pool.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
        res.json({ available: rows.length === 0 });
    }
    catch (e) {
        logger.errorFull('[checkEmail] 500', e);
        res.status(500).json({ available: false });
    }
}
export async function register(req, res) {
    const body = req.body;
    logger.info('[register] body', {
        email: body?.email,
        full_name: body?.full_name,
        company_name: body?.company_name,
        passwordLength: body?.password ? String(body.password).length : 0,
    });
    try {
        const { email, password, full_name, user_phone, company_name, company_cnpj, company_phone, company_address } = body;
        if (!email || !password) {
            logger.info('[register] 400: e-mail ou senha ausentes');
            res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
            return;
        }
        if (!company_name?.trim()) {
            logger.info('[register] 400: nome da empresa ausente');
            res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
            return;
        }
        if (String(password).length < 6) {
            logger.info('[register] 400: senha com menos de 6 caracteres');
            res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
            return;
        }
        const emailNorm = email.trim().toLowerCase();
        logger.info('[register] verificando e-mail existente', { emailNorm });
        const { rows: existing } = await pool.query(`SELECT id FROM auth.users WHERE email = $1`, [emailNorm]);
        if (existing.length > 0) {
            logger.info('[register] 409: e-mail já em uso');
            res.status(409).json({ error: 'Este e-mail já está em uso.' });
            return;
        }
        logger.info('[register] criando empresa');
        const { rows: companyRows } = await pool.query(`INSERT INTO public.companies (name, cnpj, phone, address, status)
       VALUES ($1, $2, $3, $4, 'trial')
       RETURNING id, name`, [
            company_name.trim(),
            company_cnpj?.trim() ?? null,
            company_phone?.trim() ?? null,
            company_address?.trim() || null,
        ]);
        const company = companyRows[0];
        if (!company) {
            logger.info('[register] 500: falha ao criar empresa');
            res.status(500).json({ error: 'Erro ao criar empresa.' });
            return;
        }
        logger.info('[register] gerando hash da senha');
        const hash = await bcrypt.hash(password, 10);
        logger.info('[register] inserindo em auth.users');
        const { rows } = await pool.query(`INSERT INTO auth.users (email, raw_user_meta_data, encrypted_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, raw_user_meta_data`, [emailNorm, JSON.stringify({ full_name: full_name?.trim() ?? '', phone: user_phone?.trim() ?? '' }), hash]);
        const user = rows[0];
        const fullNameVal = full_name?.trim() ?? '';
        const emailVal = user.email ?? emailNorm;
        logger.info('[register] vinculando perfil à empresa', { userId: user.id, companyId: company.id });
        await pool.query(`INSERT INTO public.profiles (id, full_name, email, company_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         company_id = EXCLUDED.company_id,
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email`, [user.id, fullNameVal, emailVal, company.id]);
        logger.info('[register] criando role admin');
        await pool.query(`INSERT INTO public.user_roles (user_id, role, company_id) VALUES ($1, 'admin', $2)
       ON CONFLICT (user_id, role, company_id) DO NOTHING`, [user.id, company.id]);
        const token = createToken(user.id);
        logger.info('[register] 201: empresa e usuário criados', {
            userId: user.id,
            companyId: company.id,
        });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.raw_user_meta_data?.full_name ?? '',
            },
            company: { id: company.id, name: company.name },
        });
    }
    catch (e) {
        logger.errorFull('[register] 500: erro ao criar conta', e);
        res.status(500).json({ error: 'Erro ao criar conta.' });
    }
}
export async function me(req, res) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (!token) {
            res.status(401).json({ error: 'Token ausente.' });
            return;
        }
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.sub;
        const { rows } = await pool.query(`SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = $1`, [userId]);
        if (rows.length === 0) {
            res.status(401).json({ error: 'Usuário não encontrado.' });
            return;
        }
        const user = rows[0];
        let company = null;
        let isAdmin = false;
        const prof = await pool.query('SELECT company_id FROM public.profiles WHERE id = $1', [user.id]);
        if (prof.rows[0]?.company_id) {
            const co = await pool.query('SELECT id, name FROM public.companies WHERE id = $1', [prof.rows[0].company_id]);
            if (co.rows[0])
                company = { id: co.rows[0].id, name: co.rows[0].name };
            const adminCheck = await pool.query(`SELECT 1 FROM public.user_roles WHERE user_id = $1 AND company_id = $2 AND role IN ('admin', 'superadmin') LIMIT 1`, [user.id, prof.rows[0].company_id]);
            isAdmin = adminCheck.rows.length > 0;
        }
        const superadmin = await pool.query(`SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'superadmin' LIMIT 1`, [user.id]);
        isAdmin = isAdmin || superadmin.rows.length > 0;
        res.json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.raw_user_meta_data?.full_name ?? '',
            },
            company,
            is_admin: isAdmin,
        });
    }
    catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}
export async function changePassword(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
        }
        if (String(new_password).length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
        }
        const { rows } = await pool.query(`SELECT id, encrypted_password FROM auth.users WHERE id = $1`, [userId]);
        if (!rows[0])
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        const ok = await bcrypt.compare(current_password, rows[0].encrypted_password ?? '');
        if (!ok)
            return res.status(401).json({ error: 'Senha atual incorreta.' });
        const hash = await bcrypt.hash(new_password, 10);
        await pool.query(`UPDATE auth.users SET encrypted_password = $1 WHERE id = $2`, [hash, userId]);
        res.json({ ok: true });
    }
    catch (e) {
        logger.errorFull('[changePassword] 500: erro ao alterar senha', e);
        res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
}
export async function invite(req, res) {
    const body = req.body;
    const { full_name, email, phone, password } = body;
    const companyId = req.companyId;
    if (!companyId) {
        res.status(403).json({ error: 'Você precisa estar vinculado a uma empresa para convidar.' });
        return;
    }
    if (!email?.trim() || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        return;
    }
    if (String(password).length < 6) {
        res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
        return;
    }
    const emailNorm = email.trim().toLowerCase();
    try {
        const { rows: existing } = await pool.query(`SELECT id FROM auth.users WHERE email = $1`, [emailNorm]);
        if (existing.length > 0) {
            res.status(409).json({ error: 'Este e-mail já está em uso.' });
            return;
        }
        const hash = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(`INSERT INTO auth.users (email, raw_user_meta_data, encrypted_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, raw_user_meta_data`, [emailNorm, JSON.stringify({ full_name: full_name?.trim() ?? '', phone: phone?.trim() ?? '' }), hash]);
        const user = rows[0];
        const fullNameVal = full_name?.trim() ?? '';
        const emailVal = user.email ?? emailNorm;
        await pool.query(`INSERT INTO public.profiles (id, full_name, email, company_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         company_id = EXCLUDED.company_id,
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email`, [user.id, fullNameVal, emailVal, companyId]);
        await pool.query(`INSERT INTO public.user_roles (user_id, role, company_id) VALUES ($1, 'usuario', $2)
       ON CONFLICT (user_id, role, company_id) DO NOTHING`, [user.id, companyId]);
        logger.info('[invite] usuário convidado', { userId: user.id, companyId });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                full_name: user.raw_user_meta_data?.full_name ?? '',
            },
        });
    }
    catch (e) {
        logger.errorFull('[invite] 500: erro ao convidar', e);
        res.status(500).json({ error: 'Erro ao convidar usuário.' });
    }
}
