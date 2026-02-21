import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, DollarSign, TrendingUp, Search, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { createCompany, exportCompanies, getAdminMetrics, getCompanies, getPlans, updateCompany, updatePlan, type CompanyListItem, type Plan } from "@/lib/api";
import { toast } from "sonner";

const SuperAdmin = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyListItem | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    cnpj: "",
    phone: "",
    address: "",
    status: "trial",
    current_plan_id: "",
  });
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    price: 0,
    trial_days: 0,
    max_users: 0,
    max_pets: 0,
    is_active: true,
  });
  const queryClient = useQueryClient();
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });
  const { data: metrics } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: getAdminMetrics,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });
  const companyMutation = useMutation({
    mutationFn: (payload: { id?: string; data: typeof companyForm }) =>
      payload.id ? updateCompany(payload.id, payload.data) : createCompany(payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa salva com sucesso!");
      setCompanyDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao salvar empresa."),
  });
  const planMutation = useMutation({
    mutationFn: (payload: { id: string; data: typeof planForm }) =>
      updatePlan(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano atualizado!");
      setPlanDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao atualizar plano."),
  });

  const filtered = companies.filter((c: CompanyListItem) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const globalStats = [
    { label: "Empresas Ativas", value: String(metrics?.stats.active_companies ?? 0), icon: Building2, color: "text-primary", trend: "" },
    { label: "Total de Usuários", value: String(metrics?.stats.total_users ?? 0), icon: Users, color: "text-primary", trend: "" },
    { label: "MRR", value: `R$ ${(metrics?.stats.mrr ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-primary", trend: "" },
    { label: "Receita (Mês)", value: `R$ ${(metrics?.stats.revenue_month ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-primary", trend: "" },
  ];

  const revenueData = metrics?.charts.revenue_by_month ?? [];
  const companiesData = metrics?.charts.companies_by_month ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Ativa</Badge>;
      case "trial":
        return <Badge className="bg-primary">Trial</Badge>;
      case "past_due":
      case "overdue":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Inadimplente</Badge>;
      default:
        return <Badge variant="secondary">{String(status)}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      Basic: "bg-slate-500",
      Pro: "bg-primary",
      Business: "bg-purple-500",
      "–": "bg-muted",
    };
    return <Badge className={colors[plan] ?? "bg-muted"}>{plan}</Badge>;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-3xl">Super Admin</CardTitle>
                  <CardDescription>Visão global da operação SaaS</CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={async () => {
                      try {
                        const blob = await exportCompanies();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "empresas.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        toast.error("Erro ao exportar empresas.");
                      }
                    }}
                  >
                    Exportar Dados
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setEditingCompany(null);
                      setCompanyForm({ name: "", cnpj: "", phone: "", address: "", status: "trial", current_plan_id: "" });
                      setCompanyDialogOpen(true);
                    }}
                  >
                    Nova Empresa
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {globalStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold">{isLoading ? "–" : stat.value}</p>
                      </div>
                      <stat.icon className={`h-7 w-7 ${stat.color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Operacional</CardTitle>
              <CardDescription>Indicadores rápidos do mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trials ativas</span>
                <span className="font-medium">{metrics?.stats.trial_companies ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Inadimplentes</span>
                <span className="font-medium">{metrics?.stats.past_due_companies ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Canceladas</span>
                <span className="font-medium">{metrics?.stats.cancelled_companies ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Novas (30d)</span>
                <span className="font-medium">{metrics?.stats.new_companies_30d ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ARPU</span>
                <span className="font-medium">R$ {(metrics?.stats.arpu ?? 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receita Recorrente (MRR)</CardTitle>
              <CardDescription>Evolução nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData.length ? revenueData : [{ month: "–", value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(value) => `R$ ${value}`} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Empresas</CardTitle>
              <CardDescription>Acompanhamento mensal</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companiesData.length ? companiesData : [{ month: "–", value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 sm:grid-cols-3">
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Empresas Cadastradas</CardTitle>
                <CardDescription>Gerenciamento de contas e assinaturas</CardDescription>
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar empresas..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && <p className="text-destructive text-sm mb-4">Erro ao carregar empresas. Acesso restrito a superadmin.</p>}
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead className="hidden md:table-cell">Plano</TableHead>
                        <TableHead className="text-center hidden md:table-cell">Usuários</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">MRR</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((company: CompanyListItem) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{getPlanBadge(company.plan)}</TableCell>
                          <TableCell className="text-center hidden md:table-cell">{company.users}</TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            {company.mrr > 0 ? `R$ ${company.mrr.toFixed(2)}` : "Trial"}
                          </TableCell>
                          <TableCell className="text-center">{getStatusBadge(company.status)}</TableCell>
                          <TableCell className="hidden lg:table-cell">{company.created ? new Date(company.created).toLocaleDateString("pt-BR") : "–"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCompany(company);
                                setCompanyForm({
                                  name: company.name,
                                  cnpj: "",
                                  phone: "",
                                  address: "",
                                  status: company.status,
                                  current_plan_id: company.plan_id ?? "",
                                });
                                  setCompanyDialogOpen(true);
                                }}
                              >
                                Ver
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Lock className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Receita Recorrente (MRR)</CardTitle>
                  <CardDescription>Evolução do faturamento mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.length ? revenueData : [{ month: "–", value: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(value) => `R$ ${value}`} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Crescimento de Empresas</CardTitle>
                  <CardDescription>Número total de empresas ativas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={companiesData.length ? companiesData : [{ month: "–", value: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Métricas Globais</CardTitle>
                <CardDescription>Indicadores chave de performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Empresas</p>
                    <p className="text-3xl font-bold mt-2">{metrics?.stats.total_companies ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Ativas</p>
                    <p className="text-3xl font-bold mt-2">{metrics?.stats.active_companies ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Trials</p>
                    <p className="text-3xl font-bold mt-2">{metrics?.stats.trial_companies ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Inadimplentes</p>
                    <p className="text-3xl font-bold mt-2">{metrics?.stats.past_due_companies ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Canceladas</p>
                    <p className="text-3xl font-bold mt-2">{metrics?.stats.cancelled_companies ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Receita vs mês anterior</p>
                    <p className="text-3xl font-bold mt-2">{(metrics?.stats.revenue_change_pct ?? 0).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">ARPU</p>
                    <p className="text-3xl font-bold mt-2">R$ {(metrics?.stats.arpu ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Receita (Mês)</p>
                    <p className="text-3xl font-bold mt-2">R$ {(metrics?.stats.revenue_month ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Novas (30d)</p>
                    <p className="text-3xl font-bold mt-2">{metrics?.stats.new_companies_30d ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Plataforma</CardTitle>
                <CardDescription>Ajustes globais do sistema SaaS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Planos e Preços</h3>
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg">
                        <span className="font-medium">{plan.name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan);
                            setPlanForm({
                              name: plan.name,
                              description: plan.description ?? "",
                              price: Number(plan.price),
                              trial_days: plan.trial_days ?? 0,
                              max_users: plan.max_users ?? 0,
                              max_pets: plan.max_pets ?? 0,
                              is_active: !!plan.is_active,
                            });
                            setPlanDialogOpen(true);
                          }}
                        >
                          Editar Plano
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Limites de Trial</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Duração do Trial</p>
                      <p className="text-xl font-bold mt-1">14 dias</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Limite de Usuários</p>
                      <p className="text-xl font-bold mt-1">5 usuários</p>
                    </div>
                  </div>
                </div>
                <Button className="w-full">Salvar Configurações</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? "Editar empresa" : "Nova empresa"}</DialogTitle>
            <DialogDescription>Dados básicos da empresa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={companyForm.name} onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={companyForm.status} onValueChange={(v) => setCompanyForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="suspended">Suspensa</SelectItem>
                  <SelectItem value="past_due">Inadimplente</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={companyForm.current_plan_id} onValueChange={(v) => setCompanyForm((f) => ({ ...f, current_plan_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!companyForm.name.trim()) return toast.error("Nome é obrigatório.");
                companyMutation.mutate({
                  id: editingCompany?.id,
                  data: { ...companyForm, current_plan_id: companyForm.current_plan_id || undefined },
                });
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar plano</DialogTitle>
            <DialogDescription>Atualize preços e limites.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={planForm.description} onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Preço</Label>
                <Input type="number" step="0.01" value={planForm.price} onChange={(e) => setPlanForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Trial (dias)</Label>
                <Input type="number" value={planForm.trial_days} onChange={(e) => setPlanForm((f) => ({ ...f, trial_days: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Max usuários</Label>
                <Input type="number" value={planForm.max_users} onChange={(e) => setPlanForm((f) => ({ ...f, max_users: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max pets</Label>
                <Input type="number" value={planForm.max_pets} onChange={(e) => setPlanForm((f) => ({ ...f, max_pets: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Ativo</Label>
              <Select value={planForm.is_active ? "true" : "false"} onValueChange={(v) => setPlanForm((f) => ({ ...f, is_active: v === "true" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!editingPlan) return;
                if (!planForm.name.trim()) return toast.error("Nome é obrigatório.");
                planMutation.mutate({ id: editingPlan.id, data: planForm });
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SuperAdmin;
