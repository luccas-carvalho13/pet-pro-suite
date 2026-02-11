import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, Calendar, DollarSign, TrendingUp, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/api";
import { Link } from "react-router-dom";

const iconMap: Record<string, typeof Calendar> = {
  Calendar,
  Users,
  DollarSign,
  Package,
  TrendingUp,
};

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-destructive p-4">Erro ao carregar o dashboard. Faça login novamente.</div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats ?? [];
  const upcomingAppointments = data?.upcomingAppointments ?? [];
  const lowStockItems = data?.lowStockItems ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua clínica veterinária</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-2 animate-pulse">
                <CardHeader className="pb-2"><div className="h-4 bg-muted rounded w-24" /></CardHeader>
                <CardContent><div className="h-8 bg-muted rounded w-16" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = iconMap[stat.icon] ?? Calendar;
                return (
                  <Card key={stat.title} className="border-2 hover:border-primary/50 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      {stat.change ? <p className="text-xs text-muted-foreground mt-1">{stat.change}</p> : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Próximas Consultas
                    </CardTitle>
                    <CardDescription>Agenda de hoje</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild><Link to="/appointments">Ver Todas</Link></Button>
                </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
                    ) : (
                      upcomingAppointments.map((apt, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">{apt.time}</div>
                            <div>
                              <p className="font-medium">{apt.client}</p>
                              <p className="text-sm text-muted-foreground">{apt.pet} - {apt.service}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-warning/50">
                <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-warning" />
                      Estoque Baixo
                    </CardTitle>
                    <CardDescription>Itens que precisam de reposição</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild><Link to="/inventory">Ver Estoque</Link></Button>
                </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lowStockItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum item com estoque baixo.</p>
                    ) : (
                      lowStockItems.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Quantidade: {item.quantity} (mínimo: {item.min})</p>
                          </div>
                          <Button size="sm" variant="outline" className="text-warning border-warning/50">Repor</Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesso rápido às funções mais usadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/appointments"><Calendar className="h-5 w-5" /><span>Nova Consulta</span></Link></Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/clients"><Users className="h-5 w-5" /><span>Novo Cliente</span></Link></Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/inventory"><Package className="h-5 w-5" /><span>Entrada Estoque</span></Link></Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild><Link to="/financial"><DollarSign className="h-5 w-5" /><span>Registrar Venda</span></Link></Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
