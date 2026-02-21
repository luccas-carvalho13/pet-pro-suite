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
    { label: "Faturamento Total", value: stats[0]?.value ?? "R$ 0", icon: TrendingUp, color: "text-success" },
    { label: "Clientes Cadastrados", value: String(clients.length), icon: Users, color: "text-primary" },
    { label: "Agendamentos", value: String(appointments.length), icon: Calendar, color: "text-info" },
    { label: "Produtos", value: "–", icon: Package, color: "text-secondary" },
  ];

  const servicesData = appointments.length
    ? [{ name: "Consultas/Atendimentos", value: appointments.length }]
    : [{ name: "Sem dados", value: 1 }];

  const downloadCsv = async (type: "clients" | "financial" | "inventory" | "services" | "users") => {
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
    const generatedAt = new Date().toLocaleString("pt-BR");
    const revenueSeriesForPrint = (revenueData.length ? revenueData : [{ month: "–", value: 0 }])
      .map((item) => `<tr><td>${item.month}</td><td>R$ ${item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`)
      .join("");
    const recentAppointments = [...appointments]
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 8)
      .map((item) => {
        const date = new Date(item.scheduledAt);
        const dateLabel = Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
        const timeLabel = item.time || (Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        return `<tr><td>${dateLabel}</td><td>${timeLabel}</td><td>${item.client || "—"}</td><td>${item.pet || "—"}</td><td>${item.service || "—"}</td></tr>`;
      })
      .join("");
    const html = `
      <html>
      <head>
        <title>Relatório</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Manrope", "Avenir Next", "Segoe UI", sans-serif;
            color: #142033;
            background: linear-gradient(160deg, #f6fbff 0%, #f4f7fb 45%, #ffffff 100%);
          }
          .page {
            max-width: 900px;
            margin: 0 auto;
            padding: 24px;
          }
          .header {
            background: linear-gradient(135deg, #0b71d9 0%, #1ca3f7 100%);
            color: #ffffff;
            border-radius: 18px;
            padding: 22px 24px;
            margin-bottom: 16px;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            align-items: flex-start;
          }
          .title {
            margin: 4px 0 0;
            font-size: 34px;
            line-height: 1.1;
            letter-spacing: -0.02em;
          }
          .subtitle {
            margin: 4px 0 0;
            font-size: 13px;
            opacity: 0.92;
          }
          .pill {
            font-size: 12px;
            padding: 7px 10px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.36);
            white-space: nowrap;
          }
          .kpis {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }
          .kpi {
            background: #ffffff;
            border: 1px solid #d9e4f2;
            border-radius: 14px;
            padding: 14px;
          }
          .kpi-label {
            margin: 0;
            font-size: 12px;
            color: #5d708a;
          }
          .kpi-value {
            margin: 8px 0 0;
            font-size: 24px;
            line-height: 1.1;
            letter-spacing: -0.02em;
            font-weight: 700;
            color: #0f2038;
          }
          .section {
            background: #ffffff;
            border: 1px solid #d9e4f2;
            border-radius: 14px;
            padding: 14px;
            margin-bottom: 12px;
          }
          .section-title {
            margin: 0 0 10px;
            font-size: 16px;
            color: #123058;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 10px;
            border: 1px solid #e4ecf6;
          }
          th {
            text-align: left;
            background: #f2f7fd;
            color: #335376;
            font-size: 12px;
            font-weight: 700;
            padding: 8px 10px;
          }
          td {
            padding: 8px 10px;
            font-size: 12px;
            border-top: 1px solid #edf2f9;
            color: #1f334d;
          }
          tr:nth-child(even) td {
            background: #fafcff;
          }
          .empty {
            font-size: 12px;
            color: #6d8098;
            margin: 0;
          }
          .footer {
            margin-top: 8px;
            font-size: 11px;
            color: #72849b;
            text-align: right;
          }
          @media print {
            body { background: #ffffff; }
            .page { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header class="header">
            <div class="header-top">
              <div>
                <p class="subtitle">FourPet Pro</p>
                <h1 class="title">Relatório Executivo</h1>
                <p class="subtitle">Gestão inteligente para negócios de quatro patas.</p>
              </div>
              <span class="pill">Gerado em ${generatedAt}</span>
            </div>
          </header>

          <section class="kpis">
            <article class="kpi">
              <p class="kpi-label">Faturamento Total</p>
              <p class="kpi-value">${stats[0]?.value ?? "R$ 0"}</p>
            </article>
            <article class="kpi">
              <p class="kpi-label">Despesas</p>
              <p class="kpi-value">${stats[1]?.value ?? "R$ 0"}</p>
            </article>
            <article class="kpi">
              <p class="kpi-label">Lucro Líquido</p>
              <p class="kpi-value">${stats[2]?.value ?? "R$ 0"}</p>
            </article>
            <article class="kpi">
              <p class="kpi-label">Caixa Atual</p>
              <p class="kpi-value">${stats[3]?.value ?? "R$ 0"}</p>
            </article>
          </section>

          <section class="section">
            <h2 class="section-title">Indicadores Gerais</h2>
            <table>
              <thead>
                <tr><th>Métrica</th><th>Valor</th></tr>
              </thead>
              <tbody>
                <tr><td>Clientes cadastrados</td><td>${clients.length}</td></tr>
                <tr><td>Agendamentos registrados</td><td>${appointments.length}</td></tr>
                <tr><td>Lançamentos financeiros</td><td>${revenues.length}</td></tr>
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2 class="section-title">Faturamento por mês</h2>
            <table>
              <thead>
                <tr><th>Mês</th><th>Receita</th></tr>
              </thead>
              <tbody>
                ${revenueSeriesForPrint}
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2 class="section-title">Últimos agendamentos</h2>
            ${
              recentAppointments
                ? `<table>
                    <thead>
                      <tr><th>Data</th><th>Hora</th><th>Tutor</th><th>Pet</th><th>Serviço</th></tr>
                    </thead>
                    <tbody>${recentAppointments}</tbody>
                  </table>`
                : `<p class="empty">Sem agendamentos recentes para exibir.</p>`
            }
          </section>
          <p class="footer">Relatório emitido por FourPet Pro</p>
        </div>
      </body>
      </html>
    `;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframe.contentDocument;
    if (!iframeWindow || !iframeDocument) {
      iframe.remove();
      toast.error("Não foi possível preparar a exportação.");
      return;
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    const cleanup = () => window.setTimeout(() => iframe.remove(), 300);
    iframeWindow.onafterprint = cleanup;
    iframeWindow.focus();
    iframeWindow.print();
    toast.info("Selecione \"Salvar como PDF\" na janela de impressão.");
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
            <Card key={stat.label} className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
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
            <Card className="border-primary/20 shadow-sm">
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
              <Card className="border-primary/20 shadow-sm">
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
              <Card className="border-primary/20 shadow-sm">
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
              <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-card to-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
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

              <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-card to-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>Relatório de Usuários</CardTitle>
                      <CardDescription>Equipe, perfil de acesso e foto de perfil</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full gap-2" onClick={() => downloadCsv("users")}>
                    <Download className="h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
              <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-card to-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
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
              <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-card to-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
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
              <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-card to-primary/5 transition-all hover:-translate-y-0.5 hover:shadow-md">
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
