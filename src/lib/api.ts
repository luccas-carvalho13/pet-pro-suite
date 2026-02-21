import { addClientLog } from './client-logs';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const CONNECTION_MSG =
  'Serviço indisponível. Verifique se a API está rodando (ex.: docker compose up ou npm run dev na pasta server).';

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Failed to fetch') return true;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message: string }).message);
    return /failed to fetch|network error|connection refused|err_connection_refused/i.test(m);
  }
  return false;
}

export type AuthUser = { id: string; email: string; full_name: string; avatar_url?: string | null };

function getToken(): string | null {
  return localStorage.getItem('petpro_token');
}

function setToken(token: string) {
  localStorage.setItem('petpro_token', token);
}

export function clearToken() {
  localStorage.removeItem('petpro_token');
}

export async function signIn(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erro ao entrar.');
    setToken(data.token);
    return { token: data.token, user: data.user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addClientLog(`POST /auth/login falhou`, msg);
    if (isNetworkError(err)) throw new Error(CONNECTION_MSG);
    throw err;
  }
}

export type SignUpPayload = {
  company_name: string;
  company_cnpj: string;
  company_phone: string;
  company_address: string;
  full_name: string;
  user_phone: string;
  email: string;
  password: string;
};

export async function signUp(payload: SignUpPayload): Promise<{ token: string; user: AuthUser }> {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: payload.company_name,
        company_cnpj: payload.company_cnpj,
        company_phone: payload.company_phone,
        company_address: payload.company_address,
        full_name: payload.full_name,
        user_phone: payload.user_phone,
        email: payload.email,
        password: payload.password,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error((data as { error?: string }).error ?? 'Erro ao criar conta.');
      if (data && typeof data === 'object' && 'field' in data) {
        (error as Error & { field?: string }).field = String((data as { field?: string }).field ?? '');
      }
      throw error;
    }
    setToken(data.token);
    return { token: data.token, user: data.user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addClientLog(`POST /auth/register falhou`, msg);
    if (isNetworkError(err)) throw new Error(CONNECTION_MSG);
    throw err;
  }
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  try {
    const res = await fetch(`${API_URL}/auth/check-email?email=${encodeURIComponent(e)}`);
    if (!res.ok) {
      addClientLog(`GET /auth/check-email → ${res.status}`, 'Verificação de e-mail indisponível.');
      // Não bloquear o cadastro se a API de checagem estiver fora.
      return true;
    }
    const data = await res.json().catch(() => ({}));
    return (data as { available?: boolean }).available === true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addClientLog(`GET /auth/check-email falhou`, msg);
    // Em erro de rede, deixa seguir e o /auth/register valida de verdade.
    return true;
  }
}

export async function signOut(): Promise<void> {
  clearToken();
}

export type Company = { id: string; name: string };

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export type MeResponse = { user: AuthUser; company: Company | null; is_admin: boolean; is_superadmin?: boolean };

export async function getMe(): Promise<MeResponse | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    clearToken();
    return null;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    user: data.user,
    company: data.company ?? null,
    is_admin: !!data.is_admin,
    is_superadmin: !!data.is_superadmin,
  };
}

export type InvitePayload = { full_name: string; email: string; phone: string; password: string };

export async function inviteUser(payload: InvitePayload): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/invite`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      full_name: payload.full_name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erro ao convidar.');
  return { user: data.user };
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Falha ao ler o arquivo."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

async function imageToOptimizedAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return fileToDataUrl(file);
  }

  const originalDataUrl = await fileToDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Falha ao processar imagem."));
    image.src = originalDataUrl;
  });

  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return originalDataUrl;

  ctx.drawImage(img, 0, 0, width, height);

  const webp = canvas.toDataURL("image/webp", 0.82);
  if (webp && webp.length < originalDataUrl.length) return webp;

  const jpeg = canvas.toDataURL("image/jpeg", 0.82);
  if (jpeg && jpeg.length < originalDataUrl.length) return jpeg;

  return originalDataUrl;
}

async function apiRequest<T>(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        clearToken();
        const msg = (data as { error?: string }).error ?? 'Sessão expirada. Faça login novamente.';
        addClientLog(`${method} ${path} → ${res.status}`, msg);
        throw new Error(msg);
      }
      const msg = (data as { error?: string }).error ?? `HTTP ${res.status}`;
      addClientLog(`${method} ${path} → ${res.status}`, msg);
      throw new Error(msg);
    }
    return data as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addClientLog(`${method} ${path} falhou`, msg);
    throw err;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        clearToken();
        const msg = (data as { error?: string }).error ?? 'Sessão expirada. Faça login novamente.';
        addClientLog(`GET ${path} → ${res.status}`, msg);
        throw new Error(msg);
      }
      const msg = (data as { error?: string }).error ?? `HTTP ${res.status}`;
      addClientLog(`GET ${path} → ${res.status}`, msg);
      throw new Error(msg);
    }
    return data as T;
  } catch (err) {
    if (err instanceof Error && !err.message.startsWith('HTTP')) {
      addClientLog(`GET ${path} falhou`, err.message);
    }
    throw err;
  }
}

export type DashboardStats = {
  stats: { title: string; value: string; change: string; icon: string }[];
  upcomingAppointments: { time: string; client: string; pet: string; service: string }[];
  lowStockItems: { name: string; quantity: number; min: number }[];
};
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiGet<DashboardStats>('/api/dashboard-stats');
}

export type Client = { id: string; name: string; email: string | null; phone: string | null; address?: string | null; pets: number; lastVisit: string; status: string };
export async function getClients(): Promise<Client[]> {
  return apiGet<Client[]>('/api/clients');
}

export type ClientPayload = { name: string; email?: string; phone?: string; address?: string };
export async function createClient(payload: ClientPayload): Promise<Client> {
  return apiRequest<Client>('/api/clients', 'POST', payload);
}
export async function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  return apiRequest<Client>(`/api/clients/${id}`, 'PUT', payload);
}
export async function deleteClient(id: string): Promise<void> {
  await apiRequest<void>(`/api/clients/${id}`, 'DELETE');
}

export type Pet = { id: string; client_id: string; name: string; species: string; breed: string; birth_date?: string | null; age: string; owner: string; lastVisit: string; status: string };
export async function getPets(): Promise<Pet[]> {
  return apiGet<Pet[]>('/api/pets');
}

export type PetPayload = { client_id: string; name: string; species: string; breed?: string; birth_date?: string };
export async function createPet(payload: PetPayload): Promise<Pet> {
  return apiRequest<Pet>('/api/pets', 'POST', payload);
}
export async function updatePet(id: string, payload: PetPayload): Promise<Pet> {
  return apiRequest<Pet>(`/api/pets/${id}`, 'PUT', payload);
}
export async function deletePet(id: string): Promise<void> {
  await apiRequest<void>(`/api/pets/${id}`, 'DELETE');
}

export type Service = { id: string; name: string; category: string; duration: string; price: number; commission: number };
export async function getServices(): Promise<Service[]> {
  return apiGet<Service[]>('/api/services');
}

export type ServicePayload = { name: string; category: string; duration_minutes: number; price: number; commission_pct?: number };
export async function createService(payload: ServicePayload): Promise<Service> {
  return apiRequest<Service>('/api/services', 'POST', payload);
}
export async function updateService(id: string, payload: ServicePayload): Promise<Service> {
  return apiRequest<Service>(`/api/services/${id}`, 'PUT', payload);
}
export async function deleteService(id: string): Promise<void> {
  await apiRequest<void>(`/api/services/${id}`, 'DELETE');
}

export type Product = { id: string; name: string; category: string; stock: number; minStock: number; price: number; status: string };
export async function getProducts(): Promise<Product[]> {
  return apiGet<Product[]>('/api/products');
}

export type ProductPayload = { name: string; category: string; stock: number; min_stock: number; price: number; unit?: string };
export async function createProduct(payload: ProductPayload): Promise<Product> {
  return apiRequest<Product>('/api/products', 'POST', payload);
}
export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, 'PUT', payload);
}
export async function deleteProduct(id: string): Promise<void> {
  await apiRequest<void>(`/api/products/${id}`, 'DELETE');
}

export type Appointment = { id: string; client_id: string; pet_id: string; service_id: string; scheduledAt: string; time: string; duration: string; client: string; pet: string; petType: string; service: string; status: string; vet: string };
export async function getAppointments(): Promise<Appointment[]> {
  return apiGet<Appointment[]>('/api/appointments');
}

export type AppointmentPayload = { client_id: string; pet_id: string; service_id: string; scheduled_at: string; duration_minutes: number; status?: string; vet_name?: string; notes?: string };
export async function createAppointment(payload: AppointmentPayload): Promise<Appointment> {
  return apiRequest<Appointment>('/api/appointments', 'POST', payload);
}
export async function updateAppointment(id: string, payload: AppointmentPayload): Promise<Appointment> {
  return apiRequest<Appointment>(`/api/appointments/${id}`, 'PUT', payload);
}
export async function deleteAppointment(id: string): Promise<void> {
  await apiRequest<void>(`/api/appointments/${id}`, 'DELETE');
}

export type MedicalRecord = {
  id: string;
  pet_id: string;
  appointment_id: string | null;
  record_date: string;
  weight_kg: number | null;
  temperature_c: number | null;
  diagnosis: string;
  treatment: string;
  notes: string;
  created_at: string;
  pet_name: string;
  client_name: string;
};

export type MedicalRecordPayload = {
  pet_id: string;
  appointment_id?: string;
  record_date: string;
  weight_kg?: number;
  temperature_c?: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
};

export async function getMedicalRecords(params?: { pet_id?: string; q?: string; page?: number; limit?: number }): Promise<MedicalRecord[]> {
  const query = new URLSearchParams();
  if (params?.pet_id) query.set('pet_id', params.pet_id);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiGet<MedicalRecord[]>(`/api/medical-records${suffix}`);
}

export async function createMedicalRecord(payload: MedicalRecordPayload): Promise<MedicalRecord> {
  return apiRequest<MedicalRecord>('/api/medical-records', 'POST', payload);
}

export async function updateMedicalRecord(id: string, payload: MedicalRecordPayload): Promise<MedicalRecord> {
  return apiRequest<MedicalRecord>(`/api/medical-records/${id}`, 'PUT', payload);
}

export async function deleteMedicalRecord(id: string): Promise<void> {
  await apiRequest<void>(`/api/medical-records/${id}`, 'DELETE');
}

export type ReminderJob = {
  id: string;
  appointment_id: string | null;
  reminder_type: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_for: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  pet_name: string;
  client_name: string;
  appointment_at: string | null;
};

export async function getReminders(params?: { status?: string; q?: string; page?: number; limit?: number }): Promise<ReminderJob[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiGet<ReminderJob[]>(`/api/reminders${suffix}`);
}

export type ProcessDueRemindersResult = {
  processed: number;
  reminders: Array<{ id: string; reminder_type: string; channel: string; scheduled_for: string; sent_at: string }>;
};

export async function processDueReminders(limit = 50): Promise<ProcessDueRemindersResult> {
  return apiRequest<ProcessDueRemindersResult>('/api/reminders/process-due', 'POST', { limit });
}

export async function cancelReminder(id: string): Promise<void> {
  await apiRequest<void>(`/api/reminders/${id}/cancel`, 'PUT');
}

export type TransactionRevenue = { id: string; date: string; description: string; type: string; value: number; status: string };
export type TransactionExpense = { id: string; date: string; description: string; category: string; value: number };
export type TransactionsData = { revenues: TransactionRevenue[]; expenses: TransactionExpense[]; stats: { label: string; value: string; icon: string }[] };
export async function getTransactions(): Promise<TransactionsData> {
  return apiGet<TransactionsData>('/api/transactions');
}

export type TransactionPayload = { type: 'revenue' | 'expense'; date: string; description: string; category?: string; value: number; status?: string };
export async function createTransaction(payload: TransactionPayload): Promise<TransactionRevenue | TransactionExpense> {
  return apiRequest<TransactionRevenue | TransactionExpense>('/api/transactions', 'POST', payload);
}
export async function updateTransaction(id: string, payload: TransactionPayload): Promise<TransactionRevenue | TransactionExpense> {
  return apiRequest<TransactionRevenue | TransactionExpense>(`/api/transactions/${id}`, 'PUT', payload);
}
export async function deleteTransaction(id: string): Promise<void> {
  await apiRequest<void>(`/api/transactions/${id}`, 'DELETE');
}

export type CashbookStats = {
  total_inflow: number;
  total_outflow: number;
  balance: number;
  inflow_month: number;
  outflow_month: number;
};

export type CashbookEntry = {
  id: string;
  transaction_id: string | null;
  entry_type: 'inflow' | 'outflow';
  amount: number;
  payment_method: string;
  description: string;
  occurred_at: string;
  reference_type: string | null;
  reference_id: string | null;
  transaction_status: string | null;
};

export type CashbookData = {
  stats: CashbookStats;
  entries: CashbookEntry[];
};

export async function getCashbook(params?: { entry_type?: 'inflow' | 'outflow'; q?: string; page?: number; limit?: number }): Promise<CashbookData> {
  const query = new URLSearchParams();
  if (params?.entry_type) query.set('entry_type', params.entry_type);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiGet<CashbookData>(`/api/cashbook${suffix}`);
}

export type CashEntryPayload = {
  entry_type: 'inflow' | 'outflow';
  amount: number;
  description: string;
  payment_method?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';
  occurred_at?: string;
};

export async function createCashEntry(payload: CashEntryPayload): Promise<CashbookEntry> {
  return apiRequest<CashbookEntry>('/api/cashbook/entries', 'POST', payload);
}

export type PendingAppointmentPayment = {
  id: string;
  scheduled_at: string;
  status: string;
  client_name: string;
  pet_name: string;
  service_name: string;
  service_price: number;
  paid_total: number;
  remaining: number;
};

export async function getPendingAppointmentPayments(): Promise<PendingAppointmentPayment[]> {
  return apiGet<PendingAppointmentPayment[]>('/api/cashbook/pending-appointments');
}

export type AppointmentPaymentPayload = {
  amount?: number;
  payment_method?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';
  paid_at?: string;
  description?: string;
};

export type AppointmentPaymentResult = {
  appointment_id: string;
  transaction_id: string;
  amount: number;
  payment_method: string;
  paid_total: number;
  remaining: number;
  payment_status: 'partial' | 'paid';
  service_price: number;
  client_name: string;
  pet_name: string;
  service_name: string;
};

export async function payAppointment(id: string, payload: AppointmentPaymentPayload): Promise<AppointmentPaymentResult> {
  return apiRequest<AppointmentPaymentResult>(`/api/cashbook/appointments/${id}/pay`, 'POST', payload);
}

export type CompanyListItem = { id: string; name: string; plan: string; plan_id?: string | null; users: number; status: string; mrr: number; created: string };
export async function getCompanies(): Promise<CompanyListItem[]> {
  return apiGet<CompanyListItem[]>('/api/companies');
}

export type CompanySettings = {
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  contact_email: string;
  website: string;
  hours: string;
};
export async function getCompanySettings(): Promise<CompanySettings> {
  return apiGet<CompanySettings>('/api/settings/company');
}
export async function updateCompanySettings(payload: CompanySettings): Promise<void> {
  await apiRequest<void>('/api/settings/company', 'PUT', payload);
}

export type NotificationSettings = {
  reminders: boolean;
  low_stock: boolean;
  payment_receipt: boolean;
  pet_birthday: boolean;
};
export async function getNotificationSettings(): Promise<NotificationSettings> {
  return apiGet<NotificationSettings>('/api/settings/notifications');
}
export async function updateNotificationSettings(payload: NotificationSettings): Promise<void> {
  await apiRequest<void>('/api/settings/notifications', 'PUT', payload);
}

export type AppearanceSettings = {
  theme: string;
  primary_color: string;
  logo_url: string;
};
export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  return apiGet<AppearanceSettings>('/api/settings/appearance');
}
export async function updateAppearanceSettings(payload: AppearanceSettings): Promise<void> {
  await apiRequest<void>('/api/settings/appearance', 'PUT', payload);
}

export type SecuritySettings = { two_factor_enabled: boolean };
export async function getSecuritySettings(): Promise<SecuritySettings> {
  return apiGet<SecuritySettings>('/api/settings/security');
}
export async function updateSecuritySettings(payload: SecuritySettings): Promise<void> {
  await apiRequest<void>('/api/settings/security', 'PUT', payload);
}

export type CompanyUser = { id: string; name: string; email: string; role: string; avatar_url?: string | null };
export async function getCompanyUsers(): Promise<CompanyUser[]> {
  return apiGet<CompanyUser[]>('/api/settings/users');
}
export async function updateCompanyUserRole(id: string, role: string): Promise<void> {
  await apiRequest<void>(`/api/settings/users/${id}`, 'PUT', { role });
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  await apiRequest<void>('/auth/change-password', 'POST', { current_password, new_password });
}

export async function getCompanyUser(id: string): Promise<CompanyUser> {
  return apiGet<CompanyUser>(`/api/settings/users/${id}`);
}

export type EntityAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export async function getAttachments(entityType: "medical_record" | "appointment" | "transaction" | "client" | "pet", entityId: string): Promise<EntityAttachment[]> {
  return apiGet<EntityAttachment[]>(`/api/attachments?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`);
}

export async function uploadAttachment(
  entityType: "medical_record" | "appointment" | "transaction" | "client" | "pet",
  entityId: string,
  file: File
): Promise<EntityAttachment> {
  const dataUrl = await fileToDataUrl(file);
  return apiRequest<EntityAttachment>("/api/attachments", "POST", {
    entity_type: entityType,
    entity_id: entityId,
    file_name: file.name,
    data_url: dataUrl,
  });
}

export async function deleteAttachment(id: string): Promise<void> {
  await apiRequest<void>(`/api/attachments/${id}`, "DELETE");
}

export async function uploadProfileAvatar(file: File): Promise<{ avatar_url: string }> {
  const dataUrl = await imageToOptimizedAvatarDataUrl(file);
  const approxBytes = Math.ceil((dataUrl.length * 3) / 4);
  if (approxBytes > 7.5 * 1024 * 1024) {
    throw new Error("Imagem muito grande. Envie uma foto menor.");
  }
  return apiRequest<{ avatar_url: string }>("/api/profile/avatar", "POST", {
    file_name: file.name,
    data_url: dataUrl,
  });
}

export async function removeProfileAvatar(): Promise<void> {
  await apiRequest<void>("/api/profile/avatar", "DELETE");
}

export async function updateMyProfile(payload: { full_name: string; email: string }): Promise<AuthUser> {
  return apiRequest<AuthUser>("/api/profile", "PUT", payload);
}

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  trial_days: number;
  max_users: number | null;
  max_pets: number | null;
  is_active: boolean;
};
export async function getPlans(): Promise<Plan[]> {
  return apiGet<Plan[]>('/api/admin/plans');
}
export async function updatePlan(id: string, payload: Omit<Plan, 'id'>): Promise<Plan> {
  return apiRequest<Plan>(`/api/admin/plans/${id}`, 'PUT', payload);
}

export type AdminCompanyPayload = { name: string; cnpj?: string; phone?: string; address?: string; status?: string; current_plan_id?: string | null };
export async function createCompany(payload: AdminCompanyPayload): Promise<{ id: string; name: string; status: string; created_at: string }> {
  return apiRequest<{ id: string; name: string; status: string; created_at: string }>(`/api/admin/companies`, 'POST', payload);
}
export async function updateCompany(id: string, payload: AdminCompanyPayload): Promise<{ id: string; name: string; status: string; created_at: string }> {
  return apiRequest<{ id: string; name: string; status: string; created_at: string }>(`/api/admin/companies/${id}`, 'PUT', payload);
}

export async function exportReport(type: 'clients' | 'financial' | 'inventory' | 'services' | 'users'): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/reports/export?type=${type}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export async function exportCompanies(): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/admin/export/companies`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

export type AdminMetrics = {
  stats: {
    total_companies: number;
    active_companies: number;
    trial_companies: number;
    past_due_companies: number;
    cancelled_companies: number;
    new_companies_30d: number;
    total_users: number;
    mrr: number;
    arpu: number;
    revenue_month: number;
    revenue_change_pct: number;
  };
  charts: {
    companies_by_status: { status: string; count: number }[];
    companies_by_month: { month: string; value: number }[];
    revenue_by_month: { month: string; value: number }[];
  };
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  return apiGet<AdminMetrics>('/api/admin/metrics');
}
