import { supabase } from "../integrations/supabase/client";

export interface Appointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  service_id: string;
  pet_id: string;
  client_id: string;
  veterinarian_id?: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  notes?: string;
  price?: number;
  payment_status: "pending" | "paid" | "partial" | "cancelled";
  tenant_id: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  services?: { id: string; name: string; price: number };
  pets?: { id: string; name: string; species: string };
  clients?: { id: string; name: string; phone: string };
  veterinarians?: { id: string; name: string };
}

export interface CreateAppointmentData {
  date: string;
  start_time: string;
  end_time: string;
  service_id: string;
  pet_id: string;
  client_id: string;
  veterinarian_id?: string;
  notes?: string;
  price?: number;
}

export const appointmentsService = {
  async getAll(tenantId: string, filters?: { date?: string; status?: string }) {
    let query = supabase
      .from("appointments")
      .select(`
        *,
        services:service_id (
          id,
          name,
          price,
          duration
        ),
        pets:pet_id (
          id,
          name,
          species,
          breed
        ),
        clients:client_id (
          id,
          name,
          phone,
          email
        ),
        veterinarians:veterinarian_id (
          id,
          name
        )
      `)
      .eq("tenant_id", tenantId);

    if (filters?.date) {
      query = query.eq("date", filters.date);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  async getById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        services:service_id (
          id,
          name,
          price,
          duration
        ),
        pets:pet_id (
          id,
          name,
          species,
          breed
        ),
        clients:client_id (
          id,
          name,
          phone,
          email
        ),
        veterinarians:veterinarian_id (
          id,
          name
        )
      `)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error) throw error;
    return data as Appointment;
  },

  async create(tenantId: string, userId: string, data: CreateAppointmentData) {
    // Buscar preço do serviço
    const { data: service } = await supabase
      .from("services")
      .select("price")
      .eq("id", data.service_id)
      .single();

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        ...data,
        price: data.price || service?.price || 0,
        tenant_id: tenantId,
        created_by: userId,
      })
      .select(`
        *,
        services:service_id (
          id,
          name,
          price,
          duration
        ),
        pets:pet_id (
          id,
          name,
          species,
          breed
        ),
        clients:client_id (
          id,
          name,
          phone,
          email
        ),
        veterinarians:veterinarian_id (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;
    return appointment as Appointment;
  },

  async update(id: string, tenantId: string, data: Partial<CreateAppointmentData>) {
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update(data)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select(`
        *,
        services:service_id (
          id,
          name,
          price,
          duration
        ),
        pets:pet_id (
          id,
          name,
          species,
          breed
        ),
        clients:client_id (
          id,
          name,
          phone,
          email
        ),
        veterinarians:veterinarian_id (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;
    return appointment as Appointment;
  },

  async delete(id: string, tenantId: string) {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
  },

  async updateStatus(id: string, tenantId: string, status: Appointment["status"]) {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return data as Appointment;
  },
};

