import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterTenantRequest {
  fullName: string;
  email: string;
  password: string;
  clinicName: string;
  slug: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  planId: string;
}

// Função simples de hash de senha (em produção, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: RegisterTenantRequest = await req.json();
    const { fullName, email, password, clinicName, slug, cnpj, phone, address, planId } = requestData;

    console.log("Iniciando registro de tenant:", { email, clinicName, planId });

    // Verificar se email já existe
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    // Verificar se slug já existe
    const { data: existingTenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingTenant) {
      throw new Error("Nome da clínica já está em uso");
    }

    // Buscar informações do plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plano inválido");
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar tenant
    const trialEndsAt = plan.is_trial
      ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: clinicName,
        slug,
        email,
        cnpj,
        phone,
        address: address ? { full: address } : null,
        subscription_status: plan.is_trial ? "trial" : "active",
        trial_ends_at: trialEndsAt,
        current_plan_id: planId,
        is_active: true,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error("Erro ao criar tenant:", tenantError);
      throw new Error("Erro ao criar clínica");
    }

    console.log("Tenant criado:", tenant.id);

    // Criar usuário admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        name: fullName,
        email,
        password: hashedPassword,
        phone,
        role: "admin",
        tenant_id: tenant.id,
        is_active: true,
        is_email_verified: false,
      })
      .select()
      .single();

    if (userError || !user) {
      console.error("Erro ao criar usuário:", userError);
      // Deletar tenant se falhar ao criar usuário
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      throw new Error("Erro ao criar usuário");
    }

    console.log("Usuário criado:", user.id);

    // Criar assinatura
    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        tenant_id: tenant.id,
        plan_id: planId,
        status: plan.is_trial ? "trial" : "active",
        trial_ends_at: trialEndsAt,
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndsAt,
      });

    if (subscriptionError) {
      console.error("Erro ao criar assinatura:", subscriptionError);
    }

    // Criar permissões padrão para admin
    const modules = ["clients", "pets", "appointments", "services", "inventory", "financial", "reports", "settings"];
    const permissionsData = modules.map((module) => ({
      tenant_id: tenant.id,
      role: "admin",
      module,
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
    }));

    const { error: permissionsError } = await supabaseAdmin
      .from("role_permissions")
      .insert(permissionsData);

    if (permissionsError) {
      console.error("Erro ao criar permissões:", permissionsError);
    }

    console.log("Registro completo com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar registro" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

