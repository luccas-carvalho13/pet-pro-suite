import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, TrendingUp, Users, Calendar, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { exportReport, getTransactions, getClients, getAppointments } from "@/lib/api";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

const Reports = () => {
  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: getClients });
  const { data: appointments = [] } = useQuery({ queryKey: ["appointments"], queryFn: getAppointments });

  const revenues = transactions?.revenues ?? [];
  const revenueByMonth = revenues.reduce(
    (acc: Record<string, number>, r: { date: string; value: number }) => {
      const m = new Date(r.date).toLocaleDateString("pt-BR", { month: "short" });
      acc[m] = (acc[m] ?? 0) + r.value;
      return acc;
    },
    {} as Record<string, number>
  );
  const revenueData = Object.entries(revenueByMonth).map(([month, value]) => ({ month, value })).slice(-6);

  const stats = transactions?.stats ?? [
    { label: "Faturamento Total (Mês)", value: "R$ 0" },
    { label: "Despesas (Mês)", value: "R$ 0" },
    { label: "Lucro Líquido", value: "R$ 0" },
    { label: "Caixa Atual", value: "R$ 0" },
  ];

  const reportStats = [
    { label: "Faturamento Total", value: stats[0]?.value ?? "R$ 0", icon: TrendingUp, color: "text-green-500" },
    { label: "Clientes Cadastrados", value: String(clients.length), icon: Users, color: "text-primary" },
    { label: "Agendamentos", value: String(appointments.length), icon: Calendar, color: "text-blue-500" },
    { label: "Produtos", value: "–", icon: Package, color: "text-secondary" },
  ];

  const servicesData = appointments.length
    ? [{ name: "Consultas/Atendimentos", value: appointments.length }]
    : [{ name: "Sem dados", value: 1 }];

  const downloadCsv = async (type: "clients" | "financial" | "inventory" | "services") => {
    try {
      const blob = await exportReport(type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Erro ao exportar relatório.");
    }
  };

  const exportPdf = () => {
    const html = `
      <html>
      <head><title>Relatório</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>Relatório Geral</h1>
        <p>Faturamento Total: ${stats[0]?.value ?? "R$ 0"}</p>
        <p>Despesas: ${stats[1]?.value ?? "R$ 0"}</p>
        <p>Lucro Líquido: ${stats[2]?.value ?? "R$ 0"}</p>
        <p>Caixa Atual: ${stats[3]?.value ?? "R$ 0"}</p>
        <hr />
        <p>Clientes: ${clients.length}</p>
        <p>Agendamentos: ${appointments.length}</p>
      </body>
      </html>
    `;
    const w = window.open("", "_blank");
    if (!w) return toast.error("Popup bloqueado.");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
            <p className="text-muted-foreground">Dados e métricas do negócio</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select defaultValue="6months">
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Último mês</SelectItem>
                <SelectItem value="3months">3 meses</SelectItem>
                <SelectItem value="6months">6 meses</SelectItem>
                <SelectItem value="1year">1 ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={exportPdf}>
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {reportStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 sm:grid-cols-3">
            <TabsTrigger value="revenue">Faturamento</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento Mensal</CardTitle>
                <CardDescription>Receitas do período (dados do banco)</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTx ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={revenueData.length ? revenueData : [{ month: "–", value: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços / Atendimentos</CardTitle>
                  <CardDescription>Quantidade de agendamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={servicesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {servicesData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Atendimentos</CardTitle>
                  <CardDescription>Receita por período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.length ? revenueData : [{ month: "–", value: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>Relatório de Clientes</CardTitle>
                      <CardDescription>Lista completa de clientes e pets</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2" onClick={() => downloadCsv("clients")}>
                    <Download className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>Relatório Financeiro</CardTitle>
                      <CardDescription>Receitas, despesas e lucro</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2" onClick={() => downloadCsv("financial")}>
                    <Download className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>Relatório de Estoque</CardTitle>
                      <CardDescription>Produtos e movimentações</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2" onClick={() => downloadCsv("inventory")}>
                    <Download className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>Relatório de Serviços</CardTitle>
                      <CardDescription>Serviços mais realizados</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2" onClick={() => downloadCsv("services")}>
                    <Download className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
