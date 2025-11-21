// Application constants

export const APP_NAME = "PetCare ERP";

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  DASHBOARD: "/dashboard",
  CLIENTS: "/clients",
  PETS: "/pets",
  APPOINTMENTS: "/appointments",
  SERVICES: "/services",
  INVENTORY: "/inventory",
  FINANCIAL: "/financial",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  SUPER_ADMIN: "/super-admin",
} as const;

export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  ATENDENTE: "atendente",
  USUARIO: "usuario",
} as const;

export const COMPANY_STATUS = {
  TRIAL: "trial",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  PAST_DUE: "past_due",
  CANCELLED: "cancelled",
} as const;

