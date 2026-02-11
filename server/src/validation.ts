import { z } from 'zod';

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} é obrigatório.`);

export const emailSchema = z.string().trim().email('E-mail inválido.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória.'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  full_name: nonEmpty('Nome completo'),
  user_phone: nonEmpty('Telefone do responsável'),
  company_name: nonEmpty('Nome da empresa'),
  company_cnpj: z.string().trim().optional(),
  company_phone: nonEmpty('Telefone da empresa'),
  company_address: z.string().trim().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória.'),
  new_password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
});

export const inviteSchema = z.object({
  full_name: z.string().trim().optional(),
  email: emailSchema,
  phone: z.string().trim().optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

export const clientPayloadSchema = z.object({
  name: nonEmpty('Nome'),
  email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export const petPayloadSchema = z.object({
  client_id: nonEmpty('Tutor'),
  name: nonEmpty('Nome do pet'),
  species: nonEmpty('Espécie'),
  breed: z.string().trim().optional(),
  birth_date: z.string().date('Data de nascimento inválida.').optional().or(z.literal('')),
});

export const servicePayloadSchema = z.object({
  name: nonEmpty('Nome'),
  category: nonEmpty('Categoria'),
  duration_minutes: z.number().int().min(1, 'Duração inválida.').max(1440, 'Duração inválida.').optional(),
  price: z.number().nonnegative('Preço inválido.'),
  commission_pct: z.number().min(0, 'Comissão inválida.').max(100, 'Comissão inválida.').optional(),
});

export const productPayloadSchema = z.object({
  name: nonEmpty('Nome'),
  category: nonEmpty('Categoria'),
  stock: z.number().int().min(0, 'Estoque inválido.').optional(),
  min_stock: z.number().int().min(0, 'Estoque mínimo inválido.').optional(),
  price: z.number().nonnegative('Preço inválido.'),
  unit: z.string().trim().optional(),
});

export const appointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']);

export const appointmentPayloadSchema = z.object({
  client_id: nonEmpty('Cliente'),
  pet_id: nonEmpty('Pet'),
  service_id: nonEmpty('Serviço'),
  scheduled_at: z.string().datetime('Data/hora é obrigatória.'),
  duration_minutes: z.number().int().min(1, 'Duração inválida.').max(1440, 'Duração inválida.').optional(),
  status: appointmentStatusSchema.optional(),
  vet_name: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const transactionPayloadSchema = z.object({
  type: z.enum(['revenue', 'expense'], {
    required_error: 'Tipo é obrigatório.',
    invalid_type_error: 'Tipo é obrigatório.',
  }),
  date: z.string().date('Data é obrigatória.'),
  description: nonEmpty('Descrição'),
  category: z.string().trim().optional(),
  value: z.number().nonnegative('Valor inválido.'),
  status: z.string().trim().optional(),
});

const paymentMethodSchema = z.enum(['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer', 'other']);

export const medicalRecordPayloadSchema = z.object({
  pet_id: nonEmpty('Pet'),
  appointment_id: z.string().trim().optional(),
  record_date: z.string().date('Data do registro inválida.'),
  weight_kg: z.number().nonnegative('Peso inválido.').max(200, 'Peso inválido.').optional(),
  temperature_c: z.number().min(30, 'Temperatura inválida.').max(45, 'Temperatura inválida.').optional(),
  diagnosis: z.string().trim().optional(),
  treatment: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const reminderProcessPayloadSchema = z.object({
  limit: z.number().int().min(1, 'Limite inválido.').max(200, 'Limite inválido.').optional(),
});

export const cashEntryPayloadSchema = z.object({
  entry_type: z.enum(['inflow', 'outflow']),
  amount: z.number().positive('Valor inválido.'),
  description: nonEmpty('Descrição'),
  payment_method: paymentMethodSchema.optional(),
  occurred_at: z.string().datetime('Data/hora inválida.').optional(),
});

export const appointmentPaymentPayloadSchema = z.object({
  amount: z.number().positive('Valor inválido.').optional(),
  payment_method: paymentMethodSchema.optional(),
  paid_at: z.string().datetime('Data/hora inválida.').optional(),
  description: z.string().trim().optional(),
});

export const companySettingsSchema = z.object({
  name: nonEmpty('Nome da empresa'),
  cnpj: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  contact_email: z.string().trim().email('E-mail de contato inválido.').optional().or(z.literal('')),
  website: z.string().trim().optional(),
  hours: z.string().trim().optional(),
});

export const notificationSettingsSchema = z.object({
  reminders: z.boolean(),
  low_stock: z.boolean(),
  payment_receipt: z.boolean(),
  pet_birthday: z.boolean(),
});

export const appearanceSettingsSchema = z.object({
  theme: z.string().trim().optional(),
  primary_color: z.string().trim().optional(),
  logo_url: z.string().trim().optional(),
});

export const securitySettingsSchema = z.object({
  two_factor_enabled: z.boolean(),
});

export const companyUserRoleSchema = z.object({
  role: z
    .string()
    .trim()
    .refine((v) => ['superadmin', 'admin', 'supervisor', 'atendente', 'usuario'].includes(v), 'Role inválida.'),
});

export const planPayloadSchema = z.object({
  name: nonEmpty('Nome'),
  description: z.string().trim().nullable().optional(),
  price: z.number().nonnegative('Preço inválido.'),
  trial_days: z.number().int().min(0, 'Período de trial inválido.'),
  max_users: z.number().int().min(1, 'Máximo de usuários inválido.').nullable().optional(),
  max_pets: z.number().int().min(1, 'Máximo de pets inválido.').nullable().optional(),
  is_active: z.boolean(),
});

export const companyPayloadSchema = z.object({
  name: nonEmpty('Nome'),
  cnpj: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  status: z.enum(['trial', 'active', 'suspended', 'past_due', 'cancelled']).optional(),
  current_plan_id: z.string().trim().nullable().optional(),
});
