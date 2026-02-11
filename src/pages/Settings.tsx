import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bell, Users, Shield, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  changePassword,
  getSecuritySettings,
  getAppearanceSettings,
  getCompanySettings,
  getCompanyUsers,
  getNotificationSettings,
  inviteUser,
  updateSecuritySettings,
  updateAppearanceSettings,
  updateCompanySettings,
  updateCompanyUserRole,
  updateNotificationSettings,
  type CompanyUser,
} from "@/lib/api";
import { BRAND_THEMES, applyBrandPalette, resolveBrandPalette } from "@/lib/appearance";

const Settings = () => {
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("atendente");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyForm, setCompanyForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    address: "",
    contact_email: "",
    website: "",
    hours: "",
  });
  const [notifForm, setNotifForm] = useState({
    reminders: true,
    low_stock: true,
    payment_receipt: true,
    pet_birthday: false,
  });
  const [appearanceForm, setAppearanceForm] = useState({
    theme: "light",
    primary_color: BRAND_THEMES[0].key,
    logo_url: "",
  });
  const [securityForm, setSecurityForm] = useState({ two_factor_enabled: false });
  const { setTheme } = useTheme();

  const { data: companySettings } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });
  const { data: notificationSettings } = useQuery({ queryKey: ["notification-settings"], queryFn: getNotificationSettings });
  const { data: appearanceSettings } = useQuery({ queryKey: ["appearance-settings"], queryFn: getAppearanceSettings });
  const { data: securitySettings } = useQuery({ queryKey: ["security-settings"], queryFn: getSecuritySettings });
  const { data: users = [] } = useQuery({ queryKey: ["company-users"], queryFn: getCompanyUsers });

  useEffect(() => {
    if (companySettings) setCompanyForm(companySettings);
  }, [companySettings]);
  useEffect(() => {
    if (notificationSettings) setNotifForm(notificationSettings);
  }, [notificationSettings]);
  useEffect(() => {
    if (appearanceSettings) {
      const resolved = resolveBrandPalette(appearanceSettings.primary_color);
      setAppearanceForm({ ...appearanceSettings, primary_color: resolved.key });
    }
  }, [appearanceSettings]);
  useEffect(() => {
    if (securitySettings) setSecurityForm(securitySettings);
  }, [securitySettings]);

  const companyMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao salvar."),
  });
  const notificationsMutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast.success("Preferências salvas!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao salvar."),
  });
  const appearanceMutation = useMutation({
    mutationFn: updateAppearanceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appearance-settings"] });
      applyBrandPalette(resolveBrandPalette(appearanceForm.primary_color));
      setTheme(appearanceForm.theme ?? "light");
      toast.success("Aparência salva!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao salvar."),
  });
  const securityMutation = useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("Segurança salva!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao salvar segurança."),
  });
  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: async (data) => {
      if (newUserRole && newUserRole !== "usuario") {
        await updateCompanyUserRole(data.user.id, newUserRole);
      }
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("Usuário convidado!");
      setNewUserEmail("");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao convidar."),
  });
  const roleMutation = useMutation({
    mutationFn: (payload: { id: string; role: string }) => updateCompanyUserRole(payload.id, payload.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("Permissão atualizada!");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao atualizar permissão."),
  });
  const passwordMutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Senha atualizada!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao atualizar senha."),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as preferências do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>
          
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Dados da Empresa</CardTitle>
                    <CardDescription>Informações básicas da clínica ou petshop</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      placeholder="PetCare Clínica Veterinária"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" placeholder="00.000.000/0000-00" value={companyForm.cnpj} onChange={(e) => setCompanyForm((f) => ({ ...f, cnpj: e.target.value }))} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" placeholder="Rua, Número - Bairro" value={companyForm.address} onChange={(e) => setCompanyForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(00) 0000-0000" value={companyForm.phone} onChange={(e) => setCompanyForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" placeholder="contato@petcare.com" value={companyForm.contact_email} onChange={(e) => setCompanyForm((f) => ({ ...f, contact_email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="www.petcare.com" value={companyForm.website} onChange={(e) => setCompanyForm((f) => ({ ...f, website: e.target.value }))} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hours">Horário de Funcionamento</Label>
                  <Textarea id="hours" placeholder="Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h" value={companyForm.hours} onChange={(e) => setCompanyForm((f) => ({ ...f, hours: e.target.value }))} />
                </div>
                
                <Button
                  onClick={() => companyMutation.mutate(companyForm)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Bell className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Notificações Automáticas</CardTitle>
                    <CardDescription>Configure lembretes e alertas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembrete de Consultas</Label>
                    <p className="text-sm text-muted-foreground">Enviar SMS/WhatsApp 1 dia antes</p>
                  </div>
                  <Switch
                    checked={notifForm.reminders}
                    onCheckedChange={(v) => setNotifForm((f) => ({ ...f, reminders: v }))}
                  />
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>Alerta de Estoque Baixo</Label>
                    <p className="text-sm text-muted-foreground">Notificar quando produtos atingirem o mínimo</p>
                  </div>
                  <Switch
                    checked={notifForm.low_stock}
                    onCheckedChange={(v) => setNotifForm((f) => ({ ...f, low_stock: v }))}
                  />
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação de Pagamento</Label>
                    <p className="text-sm text-muted-foreground">Enviar recibo por e-mail automaticamente</p>
                  </div>
                  <Switch
                    checked={notifForm.payment_receipt}
                    onCheckedChange={(v) => setNotifForm((f) => ({ ...f, payment_receipt: v }))}
                  />
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label>Aniversário de Pets</Label>
                    <p className="text-sm text-muted-foreground">Enviar mensagem no aniversário do pet</p>
                  </div>
                  <Switch
                    checked={notifForm.pet_birthday}
                    onCheckedChange={(v) => setNotifForm((f) => ({ ...f, pet_birthday: v }))}
                  />
                </div>
                
                <Button
                  onClick={() => notificationsMutation.mutate(notifForm)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Gestão de Usuários</CardTitle>
                    <CardDescription>Controle de acesso e permissões</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newUser">Adicionar Novo Usuário</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="newUser"
                      placeholder="E-mail do usuário"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="atendente">Atendente</SelectItem>
                        <SelectItem value="usuario">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => {
                        if (!newUserEmail.trim()) return toast.error("Informe o e-mail.");
                        inviteMutation.mutate({
                          full_name: "Novo usuário",
                          email: newUserEmail.trim(),
                          phone: "",
                          password: "Senha123!",
                        });
                      }}
                    >
                      Convidar
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Usuários Ativos</Label>
                  <div className="space-y-2">
                    {users.map((user: CompanyUser) => (
                      <div key={user.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(v) => roleMutation.mutate({ id: user.id, role: v })}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                              <SelectItem value="atendente">Atendente</SelectItem>
                              <SelectItem value="usuario">Usuário</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>Proteja sua conta e dados</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Switch
                    checked={securityForm.two_factor_enabled}
                    onCheckedChange={(v) => {
                      setSecurityForm({ two_factor_enabled: v });
                      securityMutation.mutate({ two_factor_enabled: v });
                    }}
                  />
                </div>
                
                <Button
                  onClick={() => {
                    if (!currentPassword || !newPassword) return toast.error("Preencha a senha atual e a nova.");
                    if (newPassword !== confirmPassword) return toast.error("As senhas não conferem.");
                    passwordMutation.mutate();
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Atualizar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Palette className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>Personalize a interface do sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={appearanceForm.theme}
                    onValueChange={(v) => setAppearanceForm((f) => ({ ...f, theme: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Cor Principal</Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {BRAND_THEMES.map((theme) => {
                      const selected = appearanceForm.primary_color === theme.key;
                      return (
                        <button
                          key={theme.key}
                          type="button"
                          onClick={() => setAppearanceForm((f) => ({ ...f, primary_color: theme.key }))}
                          className={`flex items-center gap-3 rounded-lg border p-2 text-left transition-all ${selected ? "border-primary shadow-sm" : "border-border hover:border-primary/40"}`}
                          aria-pressed={selected}
                        >
                          <span
                            className="h-10 w-10 rounded-md"
                            style={{
                              background: `linear-gradient(135deg, hsl(${theme.primary}) 0%, hsl(${theme.primarySoft}) 100%)`,
                            }}
                          />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo da Empresa</Label>
                  <Input
                    id="logo"
                    type="text"
                    placeholder="URL do logo"
                    value={appearanceForm.logo_url}
                    onChange={(e) => setAppearanceForm((f) => ({ ...f, logo_url: e.target.value }))}
                  />
                </div>
                
                <Button
                  onClick={() => appearanceMutation.mutate(appearanceForm)}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Salvar Aparência
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
