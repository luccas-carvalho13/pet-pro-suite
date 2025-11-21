import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Building2, Bell, Users, Shield, Palette, Save, CreditCard } from "lucide-react";
import { plansService } from "@/api/services/plans.service";
import { subscriptionsService } from "@/api/services/subscriptions.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Permissions } from "./Permissions";

const Settings = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Buscar planos disponíveis
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => plansService.getAll(),
  });

  // Buscar assinatura atual
  const { data: subscription } = useQuery({
    queryKey: ["subscription", tenantId],
    queryFn: () => {
      if (!tenantId) return null;
      return subscriptionsService.getByTenant(tenantId);
    },
    enabled: !!tenantId,
  });
  const [settings, setSettings] = useState({
    companyName: "",
    cnpj: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    hours: "",
    notifications: {
      appointmentReminder: true,
      lowStock: true,
      paymentConfirmation: true,
      petBirthday: false,
    },
    security: {
      twoFactor: false,
    },
    appearance: {
      theme: "light",
      primaryColor: "blue",
    },
  });

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`${section} salvo com sucesso!`);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as preferências do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full max-w-5xl grid-cols-7">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
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
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input 
                      id="cnpj" 
                      placeholder="00.000.000/0000-00"
                      value={settings.cnpj}
                      onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input 
                    id="address" 
                    placeholder="Rua, Número - Bairro"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      placeholder="(00) 0000-0000"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="contato@petcare.com"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      placeholder="www.petcare.com"
                      value={settings.website}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hours">Horário de Funcionamento</Label>
                  <Textarea 
                    id="hours" 
                    placeholder="Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h"
                    value={settings.hours}
                    onChange={(e) => setSettings({ ...settings, hours: e.target.value })}
                  />
                </div>
                
                <Button onClick={() => handleSave("Dados da empresa")} className="gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar Alterações"}
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
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembrete de Consultas</Label>
                    <p className="text-sm text-muted-foreground">Enviar SMS/WhatsApp 1 dia antes</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.appointmentReminder}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, appointmentReminder: checked }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alerta de Estoque Baixo</Label>
                    <p className="text-sm text-muted-foreground">Notificar quando produtos atingirem o mínimo</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, lowStock: checked }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação de Pagamento</Label>
                    <p className="text-sm text-muted-foreground">Enviar recibo por e-mail automaticamente</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.paymentConfirmation}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, paymentConfirmation: checked }
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aniversário de Pets</Label>
                    <p className="text-sm text-muted-foreground">Enviar mensagem no aniversário do pet</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.petBirthday}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, petBirthday: checked }
                      })
                    }
                  />
                </div>
                
                <Button onClick={() => handleSave("Notificações")} className="gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar Preferências"}
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
                  <div className="flex gap-2">
                    <Input id="newUser" placeholder="E-mail do usuário" />
                    <Select defaultValue="atendente">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="veterinario">Veterinário</SelectItem>
                        <SelectItem value="atendente">Atendente</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => toast.success("Convite enviado!")}>Convidar</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Usuários Ativos</Label>
                  <div className="space-y-2">
                    {[
                      { name: "João Silva", email: "joao@petcare.com", role: "Administrador" },
                      { name: "Maria Santos", email: "maria@petcare.com", role: "Veterinária" },
                      { name: "Carlos Lima", email: "carlos@petcare.com", role: "Atendente" },
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{user.role}</span>
                          <Button variant="ghost" size="sm" onClick={() => toast.info("Editar usuário")}>
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Permissions tenantId={tenantId || "mock-tenant-id"} />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle>Planos e Assinatura</CardTitle>
                    <CardDescription>Gerencie seu plano e assinatura</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscription && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Plano Atual</p>
                        <p className="text-sm text-muted-foreground">
                          {plans.find(p => p.id === subscription.plan_id)?.name || "Plano"}
                        </p>
                      </div>
                      <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                        {subscription.status === "active" ? "Ativo" : subscription.status}
                      </Badge>
                    </div>
                    {subscription.trial_ends_at && (
                      <p className="text-sm text-muted-foreground">
                        Trial expira em: {new Date(subscription.trial_ends_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                    {subscription.ends_at && (
                      <p className="text-sm text-muted-foreground">
                        Próximo vencimento: {new Date(subscription.ends_at).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-4">
                  <CardTitle>Planos Disponíveis</CardTitle>
                  <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => (
                      <Card key={plan.id} className={subscription?.plan_id === plan.id ? "border-primary border-2" : ""}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{plan.name}</span>
                            {plan.is_trial && (
                              <Badge className="bg-green-500">Trial</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-3xl font-bold">
                              {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2)}`}
                              {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                            </p>
                          </div>
                          {plan.features && Array.isArray(plan.features) && (
                            <ul className="space-y-2 text-sm">
                              {plan.features.map((feature: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <span className="text-green-500">✓</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <Button 
                            className="w-full" 
                            variant={subscription?.plan_id === plan.id ? "outline" : "default"}
                            disabled={subscription?.plan_id === plan.id}
                            onClick={() => toast.info("Funcionalidade de troca de plano em desenvolvimento")}
                          >
                            {subscription?.plan_id === plan.id ? "Plano Atual" : "Contratar Plano"}
                          </Button>
                        </CardContent>
                      </Card>
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
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Switch 
                    checked={settings.security.twoFactor}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactor: checked }
                      })
                    }
                  />
                </div>
                
                <Button onClick={() => handleSave("Senha")} className="gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? "Atualizando..." : "Atualizar Senha"}
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
                    value={settings.appearance.theme}
                    onValueChange={(value) => 
                      setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, theme: value }
                      })
                    }
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
                  <div className="grid grid-cols-6 gap-2">
                    {['blue', 'teal', 'green', 'purple', 'pink', 'orange'].map((color) => (
                      <button
                        key={color}
                        className={`h-12 rounded-lg bg-${color}-500 hover:scale-110 transition-transform ${
                          settings.appearance.primaryColor === color ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => 
                          setSettings({
                            ...settings,
                            appearance: { ...settings.appearance, primaryColor: color }
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo da Empresa</Label>
                  <Input id="logo" type="file" accept="image/*" />
                </div>
                
                <Button onClick={() => handleSave("Aparência")} className="gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? "Salvando..." : "Salvar Aparência"}
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
