import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Bell, Users, Shield, Save, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  changePassword,
  getSecuritySettings,
  getCompanySettings,
  getCompanyUsers,
  getMe,
  getNotificationSettings,
  inviteUser,
  removeProfileAvatar,
  updateSecuritySettings,
  updateCompanySettings,
  updateCompanyUserRole,
  updateNotificationSettings,
  uploadProfileAvatar,
  type CompanyUser,
} from "@/lib/api";

const Settings = () => {
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("atendente");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
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
  const [securityForm, setSecurityForm] = useState({ two_factor_enabled: false });

  const { data: companySettings } = useQuery({ queryKey: ["company-settings"], queryFn: getCompanySettings });
  const { data: notificationSettings } = useQuery({ queryKey: ["notification-settings"], queryFn: getNotificationSettings });
  const { data: securitySettings } = useQuery({ queryKey: ["security-settings"], queryFn: getSecuritySettings });
  const { data: me, isLoading: loadingMe } = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const { data: users = [] } = useQuery({ queryKey: ["company-users"], queryFn: getCompanyUsers });
  const canManageUsers = !!me?.is_admin;
  const myInitials = (me?.user.full_name || "U")
    .split(" ")
    .map((v) => v[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (companySettings) setCompanyForm(companySettings);
  }, [companySettings]);
  useEffect(() => {
    if (notificationSettings) setNotifForm(notificationSettings);
  }, [notificationSettings]);
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

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setAvatarUploading(true);
      await uploadProfileAvatar(file);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("Foto de perfil atualizada.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar foto.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      setAvatarUploading(true);
      await removeProfileAvatar();
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success("Foto removida.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover foto.");
    } finally {
      setAvatarUploading(false);
    }
  };

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
          <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
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
                {loadingMe ? (
                  <p className="text-sm text-muted-foreground">Carregando permissões...</p>
                ) : canManageUsers ? (
                  <div className="space-y-2">
                    <Label htmlFor="newUser">Adicionar Novo Usuário</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="newUser"
                        type="email"
                        autoComplete="email"
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
                        disabled={inviteMutation.isPending}
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
                ) : (
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Apenas administradores podem convidar usuários e alterar permissões.
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Usuários Ativos</Label>
                  <div className="space-y-2">
                    {users.map((user: CompanyUser) => (
                      <div key={user.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url ?? ""} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name.split(" ").map((part) => part[0] ?? "").join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            disabled={!canManageUsers}
                            onValueChange={(v) => {
                              if (!canManageUsers) return;
                              roleMutation.mutate({ id: user.id, role: v });
                            }}
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
                  <Label>Foto do Perfil</Label>
                  <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={me?.user.avatar_url ?? ""} alt={me?.user.full_name ?? "Usuário"} />
                        <AvatarFallback className="bg-primary/10 text-primary">{myInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Imagem exibida no sistema e relatórios de usuários</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP até 8MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={avatarUploading}
                        onClick={() => document.getElementById("profileAvatarInput")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar foto
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={avatarUploading || !me?.user.avatar_url}
                        onClick={handleAvatarRemove}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                      <input
                        id="profileAvatarInput"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          void handleAvatarUpload(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
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
          
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
