import express from 'express';
import cors from 'cors';
import { login, register, me, invite, checkEmail, changePassword } from './auth.js';
import { requireAuth, requireAdmin, requireCompany } from './middleware.js';
import * as api from './routes/api.js';
import { logger, logFilePath, getLogLines } from './logger.js';
import { loginRateLimit } from './rate-limit.js';
import { pathToFileURL } from 'url';
import { getMetricsSnapshot, observabilityMiddleware } from './observability.js';

const port = Number(process.env.PORT) || 3001;

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(observabilityMiddleware);

  app.post('/auth/login', loginRateLimit, login);
  app.post('/auth/register', register);
  app.get('/auth/me', me);
  app.get('/auth/check-email', checkEmail);
  app.post('/auth/change-password', requireAuth, changePassword);

  app.get('/api/logs', requireAuth, requireAdmin, (_req, res) => res.json({ logs: getLogLines() }));

  app.get('/api/dashboard-stats', requireAuth, requireCompany, api.dashboardStats);
  app.get('/api/clients', requireAuth, requireCompany, api.getClients);
  app.post('/api/clients', requireAuth, requireCompany, api.createClient);
  app.put('/api/clients/:id', requireAuth, requireCompany, api.updateClient);
  app.delete('/api/clients/:id', requireAuth, requireCompany, api.deleteClient);
  app.get('/api/pets', requireAuth, requireCompany, api.getPets);
  app.post('/api/pets', requireAuth, requireCompany, api.createPet);
  app.put('/api/pets/:id', requireAuth, requireCompany, api.updatePet);
  app.delete('/api/pets/:id', requireAuth, requireCompany, api.deletePet);
  app.get('/api/services', requireAuth, requireCompany, api.getServices);
  app.post('/api/services', requireAuth, requireCompany, api.createService);
  app.put('/api/services/:id', requireAuth, requireCompany, api.updateService);
  app.delete('/api/services/:id', requireAuth, requireCompany, api.deleteService);
  app.get('/api/products', requireAuth, requireCompany, api.getProducts);
  app.post('/api/products', requireAuth, requireCompany, api.createProduct);
  app.put('/api/products/:id', requireAuth, requireCompany, api.updateProduct);
  app.delete('/api/products/:id', requireAuth, requireCompany, api.deleteProduct);
  app.get('/api/appointments', requireAuth, requireCompany, api.getAppointments);
  app.post('/api/appointments', requireAuth, requireCompany, api.createAppointment);
  app.put('/api/appointments/:id', requireAuth, requireCompany, api.updateAppointment);
  app.delete('/api/appointments/:id', requireAuth, requireCompany, api.deleteAppointment);
  app.get('/api/transactions', requireAuth, requireCompany, api.getTransactions);
  app.post('/api/transactions', requireAuth, requireCompany, api.createTransaction);
  app.put('/api/transactions/:id', requireAuth, requireCompany, api.updateTransaction);
  app.delete('/api/transactions/:id', requireAuth, requireCompany, api.deleteTransaction);
  app.get('/api/companies', requireAuth, api.getCompanies);
  app.get('/api/settings/company', requireAuth, requireCompany, api.getCompanySettings);
  app.put('/api/settings/company', requireAuth, requireCompany, api.updateCompanySettings);
  app.get('/api/settings/notifications', requireAuth, requireCompany, api.getNotificationSettings);
  app.put('/api/settings/notifications', requireAuth, requireCompany, api.updateNotificationSettings);
  app.get('/api/settings/appearance', requireAuth, requireCompany, api.getAppearanceSettings);
  app.put('/api/settings/appearance', requireAuth, requireCompany, api.updateAppearanceSettings);
  app.get('/api/settings/security', requireAuth, api.getUserSecuritySettings);
  app.put('/api/settings/security', requireAuth, api.updateUserSecuritySettings);
  app.get('/api/settings/users', requireAuth, requireCompany, api.getCompanyUsers);
  app.put('/api/settings/users/:id', requireAuth, requireCompany, api.updateCompanyUserRole);
  app.get('/api/reports/export', requireAuth, requireCompany, api.exportReport);
app.get('/api/admin/plans', requireAuth, api.getPlans);
app.put('/api/admin/plans/:id', requireAuth, api.updatePlan);
app.post('/api/admin/companies', requireAuth, api.createCompany);
app.put('/api/admin/companies/:id', requireAuth, api.updateCompany);
app.get('/api/admin/export/companies', requireAuth, api.exportCompanies);
app.get('/api/admin/metrics', requireAuth, api.getAdminMetrics);
  app.post('/api/invite', requireAuth, requireAdmin, invite);

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/metrics', requireAuth, requireAdmin, (_req, res) => res.json(getMetricsSnapshot()));
  return app;
}

const app = createApp();
const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isDirectRun) {
  app.listen(port, () => {
    logger.info(`API rodando em http://localhost:${port}`);
    logger.info(`Logs gravados em: ${logFilePath}`);
  });
}
