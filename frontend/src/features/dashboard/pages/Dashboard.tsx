import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Users, Calendar, DollarSign, TrendingUp, Package, Clock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAuth } from "@/shared/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { appointmentsService } from "@/api/services/appointments.service";
import { clientsService } from "@/api/services/clients.service";
import { productsService } from "@/api/services/products.service";
import { financialTransactionsService } from "@/api/services/financial-transactions.service";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Dashboard = () => {
  const { tenantId } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  // Buscar agendamentos de hoje
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["appointments", "today", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return appointmentsService.getAll(tenantId, { date: today });
    },
    enabled: !!tenantId,
  });

  // Buscar todos os clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["clients", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return clientsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar produtos com estoque baixo
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["products", "low-stock", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return productsService.getLowStock(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar estatísticas financeiras do mês atual
  const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
  const endOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

  const { data: financialStats } = useQuery({
    queryKey: ["financial", "stats", tenantId, startOfMonth, endOfMonth],
    queryFn: () => {
      if (!tenantId) return { totalIncome: 0, totalExpenses: 0, balance: 0 };
      return financialTransactionsService.getStats(tenantId, startOfMonth, endOfMonth);
    },
    enabled: !!tenantId,
  });

  // Calcular estatísticas
  const appointmentsToday = todayAppointments.length;
  const confirmedToday = todayAppointments.filter(a => a.status === "confirmed").length;
  const totalClientsCount = clients.length;
  const monthlyRevenue = financialStats?.totalIncome || 0;
  const occupancyRate = appointmentsToday > 0 ? Math.round((confirmedToday / appointmentsToday) * 100) : 0;

  const stats = [
    {
      title: "Consultas Hoje",
      value: appointmentsToday.toString(),
      change: `${confirmedToday} confirmadas`,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Clientes Ativos",
      value: totalClientsCount.toString(),
      change: `${totalClientsCount} cadastrados`,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Faturamento Mensal",
      value: `R$ ${monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Este mês",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Taxa de Ocupação",
      value: `${occupancyRate}%`,
      change: appointmentsToday > 0 ? "Hoje" : "Sem agendamentos",
      icon: TrendingUp,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  // Próximas consultas (limitado a 4)
  const upcomingAppointments = todayAppointments.slice(0, 4).map((apt: any) => ({
    time: apt.start_time,
    client: apt.clients?.name || "Cliente",
    pet: apt.pets?.name || "Pet",
    service: apt.services?.name || "Serviço",
  }));

  // Estoque baixo (limitado a 3)
  const lowStockItems = lowStockProducts.slice(0, 3).map((product: any) => ({
    name: product.name,
    quantity: product.stock,
    min: product.min_stock,
  }));

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
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua clínica veterinária</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-2 hover:border-primary/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`h-10 w-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Appointments */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Próximas Consultas
                  </CardTitle>
                  <CardDescription>Agenda de hoje</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/appointments")}>
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma consulta agendada para hoje
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold">
                        {appointment.time}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{appointment.client}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.pet} - {appointment.service}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    Estoque Baixo
                  </CardTitle>
                  <CardDescription>Itens que precisam de reposição</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate("/inventory")}>
                  Ver Estoque
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item com estoque baixo
                </p>
              ) : (
                <div className="space-y-4">
                  {lowStockItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantity} (mínimo: {item.min})
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-orange-300"
                        onClick={() => {
                          const product = lowStockProducts.find(p => p.name === item.name);
                          if (product) {
                            navigate(`/inventory?edit=${product.id}`);
                          } else {
                            navigate("/inventory");
                          }
                        }}
                      >
                        Repor
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às funções mais usadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate("/appointments")}
              >
                <Calendar className="h-6 w-6" />
                Nova Consulta
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate("/clients")}
              >
                <Users className="h-6 w-6" />
                Novo Cliente
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate("/inventory")}
              >
                <Package className="h-6 w-6" />
                Entrada Estoque
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate("/financial")}
              >
                <DollarSign className="h-6 w-6" />
                Registrar Venda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
