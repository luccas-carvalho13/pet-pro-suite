import { useState } from "react";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { FileText, Download, TrendingUp, Users, Calendar, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/shared/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { financialTransactionsService } from "@/api/services/financial-transactions.service";
import { appointmentsService } from "@/api/services/appointments.service";
import { clientsService } from "@/api/services/clients.service";
import { productsService } from "@/api/services/products.service";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";

const Reports = () => {
  const { tenantId } = useAuth();
  const [period, setPeriod] = useState("6months");

  // Calcular datas baseado no período selecionado
  const getDateRange = () => {
    const end = endOfMonth(new Date());
    let start: Date;
    switch (period) {
      case "1month":
        start = startOfMonth(new Date());
        break;
      case "3months":
        start = startOfMonth(subMonths(new Date(), 2));
        break;
      case "6months":
        start = startOfMonth(subMonths(new Date(), 5));
        break;
      case "1year":
        start = startOfMonth(subMonths(new Date(), 11));
        break;
      default:
        start = startOfMonth(subMonths(new Date(), 5));
    }
    return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") };
  };

  const { start, end } = getDateRange();

  // Buscar dados financeiros
  const { data: financialStats } = useQuery({
    queryKey: ["financial", "stats", tenantId, start, end],
    queryFn: () => {
      if (!tenantId) return { totalIncome: 0, totalExpenses: 0, balance: 0 };
      return financialTransactionsService.getStats(tenantId, start, end);
    },
    enabled: !!tenantId,
  });

  // Buscar todas as transações para gráfico
  const { data: allTransactions = [] } = useQuery({
    queryKey: ["financial", "all", tenantId, start, end],
    queryFn: () => {
      if (!tenantId) return [];
      return financialTransactionsService.getAll(tenantId, { startDate: start, endDate: end });
    },
    enabled: !!tenantId,
  });

  // Buscar agendamentos
  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", "all", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return appointmentsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return clientsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar produtos
  const { data: products = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return productsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Preparar dados para gráficos
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const monthStart = format(startOfMonth(month), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(month), "yyyy-MM-dd");
    const monthTransactions = allTransactions.filter(
      (t: any) => t.date >= monthStart && t.date <= monthEnd && t.type === "income"
    );
    const total = monthTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    return {
      month: format(month, "MMM").substring(0, 3),
      value: total,
    };
  });

  // Serviços mais realizados (baseado em agendamentos)
  const servicesData = appointments.reduce((acc: any, apt: any) => {
    const serviceName = apt.services?.name || "Outros";
    const existing = acc.find((s: any) => s.name === serviceName);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: serviceName, value: 1 });
    }
    return acc;
  }, []).slice(0, 4);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const stats = [
    {
      label: "Faturamento Total",
      value: `R$ ${(financialStats?.totalIncome || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Clientes Atendidos",
      value: clients.length.toString(),
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Consultas Realizadas",
      value: appointments.filter((a: any) => a.status === "completed").length.toString(),
      icon: Calendar,
      color: "text-blue-500",
    },
    {
      label: "Produtos Vendidos",
      value: products.length.toString(),
      icon: Package,
      color: "text-secondary",
    },
  ];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Título
      doc.setFontSize(20);
      doc.text("Relatório de Análises", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Período
      doc.setFontSize(12);
      const periodLabel = period === "1month" ? "Último mês" : 
                         period === "3months" ? "3 meses" :
                         period === "6months" ? "6 meses" : "1 ano";
      doc.text(`Período: ${periodLabel}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Estatísticas Financeiras
      if (financialStats) {
        doc.setFontSize(16);
        doc.text("Estatísticas Financeiras", 14, yPosition);
        yPosition += 8;
        
        doc.setFontSize(11);
        doc.text(`Receita Total: R$ ${financialStats.totalIncome.toFixed(2)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Despesas Total: R$ ${financialStats.totalExpenses.toFixed(2)}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Lucro Líquido: R$ ${financialStats.balance.toFixed(2)}`, 20, yPosition);
        yPosition += 10;
      }

      // Estatísticas de Agendamentos
      if (appointments && appointments.length > 0) {
        doc.setFontSize(16);
        doc.text("Estatísticas de Agendamentos", 14, yPosition);
        yPosition += 8;
        
        doc.setFontSize(11);
        doc.text(`Total de Agendamentos: ${appointments.length}`, 20, yPosition);
        yPosition += 7;
        
        const confirmed = appointments.filter((a: any) => a.status === "confirmed").length;
        doc.text(`Confirmados: ${confirmed}`, 20, yPosition);
        yPosition += 7;
        
        const completed = appointments.filter((a: any) => a.status === "completed").length;
        doc.text(`Concluídos: ${completed}`, 20, yPosition);
        yPosition += 10;
      }

      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Estatísticas de Clientes
      if (clients && clients.length > 0) {
        doc.setFontSize(16);
        doc.text("Estatísticas de Clientes", 14, yPosition);
        yPosition += 8;
        
        doc.setFontSize(11);
        doc.text(`Total de Clientes: ${clients.length}`, 20, yPosition);
        yPosition += 10;
      }

      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Estatísticas de Produtos
      if (products && products.length > 0) {
        doc.setFontSize(16);
        doc.text("Estatísticas de Produtos", 14, yPosition);
        yPosition += 8;
        
        doc.setFontSize(11);
        doc.text(`Total de Produtos: ${products.length}`, 20, yPosition);
        yPosition += 7;
        
        const lowStock = products.filter((p: any) => p.stock <= p.min_stock).length;
        doc.text(`Produtos com Estoque Baixo: ${lowStock}`, 20, yPosition);
        yPosition += 10;
      }

      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      // Salvar PDF
      const fileName = `relatorio-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const handleGenerateReport = (type: string) => {
    toast.success(`Gerando relatório de ${type}...`);
    // Implementar geração específica por tipo se necessário
    handleExportPDF();
  };

  if (!tenantId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
            <p className="text-muted-foreground">Dados e métricas do negócio</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Último mês</SelectItem>
                <SelectItem value="3months">3 meses</SelectItem>
                <SelectItem value="6months">6 meses</SelectItem>
                <SelectItem value="1year">1 ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
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
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="revenue">Faturamento</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faturamento Mensal</CardTitle>
                <CardDescription>Evolução do faturamento nos últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Serviços Mais Realizados</CardTitle>
                  <CardDescription>Distribuição dos serviços</CardDescription>
                </CardHeader>
                <CardContent>
                  {servicesData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">Sem dados disponíveis</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={servicesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => entry.name}
                          outerRadius={100}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {servicesData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Atendimentos</CardTitle>
                  <CardDescription>Evolução do número de serviços</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
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
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleGenerateReport("clientes")}>
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
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleGenerateReport("financeiro")}>
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
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleGenerateReport("estoque")}>
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
                  <Button variant="outline" className="w-full gap-2" onClick={() => handleGenerateReport("serviços")}>
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
