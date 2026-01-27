import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterCompanyRequest {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  planId: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: RegisterCompanyRequest = await req.json();
    const { fullName, email, password, companyName, cnpj, phone, address, planId } = requestData;

    console.log("Iniciando registro de empresa:", { email, companyName, planId });

    // Buscar informações do plano
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error("Plano inválido");
    }

    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error("Erro ao criar usuário:", authError);
      throw new Error(authError?.message || "Erro ao criar usuário");
    }

    console.log("Usuário criado:", authData.user.id);

    // Calcular data de expiração do trial
    const trialEndsAt = plan.trial_days > 0
      ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Criar empresa
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        cnpj,
        phone,
        address,
        status: plan.trial_days > 0 ? "trial" : "active",
        current_plan_id: planId,
        trial_ends_at: trialEndsAt,
      })
      .select()
      .single();

    if (companyError || !company) {
      console.error("Erro ao criar empresa:", companyError);
      // Deletar usuário se falhar ao criar empresa
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error("Erro ao criar empresa");
    }

    console.log("Empresa criada:", company.id);

    // Atualizar profile com company_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        company_id: company.id,
        full_name: fullName,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Erro ao atualizar profile:", profileError);
    }

    // Criar role de admin para o usuário
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "admin",
        company_id: company.id,
      });

    if (roleError) {
      console.error("Erro ao criar role:", roleError);
    }

    // Criar assinatura
    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        company_id: company.id,
        plan_id: planId,
        status: "active",
        is_trial: plan.trial_days > 0,
        ends_at: trialEndsAt,
      });

    if (subscriptionError) {
      console.error("Erro ao criar assinatura:", subscriptionError);
    }

    // Criar permissões padrão para admin
    const modules = ["clients", "pets", "appointments", "services", "inventory", "financial", "reports", "settings"];
    const permissionsData = modules.map((module) => ({
      company_id: company.id,
      role: "admin",
      module,
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true,
    }));

    const { error: permissionsError } = await supabaseAdmin
      .from("permissions")
      .insert(permissionsData);

    if (permissionsError) {
      console.error("Erro ao criar permissões:", permissionsError);
    }

    console.log("Registro completo com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        user: authData.user,
        company,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Erro no registro:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: message || "Erro ao processar registro" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
