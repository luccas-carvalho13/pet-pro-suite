import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, DollarSign, TrendingUp, Search, Lock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const SuperAdmin = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const globalStats = [
    { label: "Empresas Ativas", value: "47", icon: Building2, color: "text-primary", trend: "+12%" },
    { label: "Total de Usuários", value: "234", icon: Users, color: "text-blue-500", trend: "+8%" },
    { label: "Faturamento MRR", value: "R$ 23.500", icon: DollarSign, color: "text-green-500", trend: "+15%" },
    { label: "Taxa de Crescimento", value: "18.2%", icon: TrendingUp, color: "text-orange-500", trend: "+3%" },
  ];

  const companies = [
    { 
      id: 1, 
      name: "PetCare Clínica", 
      plan: "Pro", 
      users: 8, 
      status: "active",
      mrr: 299.00,
      created: "2024-01-10"
    },
    { 
      id: 2, 
      name: "VetClinic São Paulo", 
      plan: "Business", 
      users: 15, 
      status: "active",
      mrr: 599.00,
      created: "2023-12-15"
    },
    { 
      id: 3, 
      name: "Petshop Amor Animal", 
      plan: "Pro", 
      users: 6, 
      status: "trial",
      mrr: 0,
      created: "2024-01-20"
    },
    { 
      id: 4, 
      name: "Clínica Bicho Feliz", 
      plan: "Basic", 
      users: 3, 
      status: "overdue",
      mrr: 99.00,
      created: "2023-11-05"
    },
  ];

  const revenueData = [
    { month: "Jul", value: 18500 },
    { month: "Ago", value: 19200 },
    { month: "Set", value: 20100 },
    { month: "Out", value: 21300 },
    { month: "Nov", value: 22400 },
    { month: "Dez", value: 23500 },
  ];

  const companiesData = [
    { month: "Jul", value: 35 },
    { month: "Ago", value: 38 },
    { month: "Set", value: 41 },
    { month: "Out", value: 43 },
    { month: "Nov", value: 45 },
    { month: "Dez", value: 47 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="h-3 w-3" />Ativa</Badge>;
      case "trial":
        return <Badge className="bg-blue-500">Trial</Badge>;
      case "overdue":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Inadimplente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      Basic: "bg-slate-500",
      Pro: "bg-primary",
      Business: "bg-purple-500"
    };
    return <Badge className={colors[plan as keyof typeof colors]}>{plan}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Gestão global da plataforma SaaS</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Exportar Dados</Button>
            <Button>Nova Empresa</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {globalStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-green-500 mt-1">{stat.trend} vs mês anterior</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-center">Usuários</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{getPlanBadge(company.plan)}</TableCell>
                        <TableCell className="text-center">{company.users}</TableCell>
                        <TableCell className="text-right">
                          {company.mrr > 0 ? `R$ ${company.mrr.toFixed(2)}` : "Trial"}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(company.status)}</TableCell>
                        <TableCell>{new Date(company.created).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm">Ver</Button>
                            <Button variant="ghost" size="sm">
                              <Lock className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value) => `R$ ${value}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                      />
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
                    <BarChart data={companiesData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
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
                    <p className="text-sm text-muted-foreground">Taxa de Conversão Trial</p>
                    <p className="text-3xl font-bold mt-2">68%</p>
                    <p className="text-xs text-green-500 mt-1">+5% vs mês anterior</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Churn Rate</p>
                    <p className="text-3xl font-bold mt-2">3.2%</p>
                    <p className="text-xs text-red-500 mt-1">+0.5% vs mês anterior</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">LTV Médio</p>
                    <p className="text-3xl font-bold mt-2">R$ 8.400</p>
                    <p className="text-xs text-green-500 mt-1">+12% vs mês anterior</p>
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
                    {['Basic', 'Pro', 'Business'].map((plan) => (
                      <div key={plan} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{plan}</span>
                        <Button variant="outline" size="sm">Editar Plano</Button>
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
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Bloqueios Automáticos</h3>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm">Bloquear acesso após:</p>
                    <p className="text-lg font-semibold mt-1">7 dias de inadimplência</p>
                  </div>
                </div>
                
                <Button className="w-full">Salvar Configurações</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdmin;
