import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, Calendar, DollarSign, TrendingUp, Package, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/api";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  const nextAppointment = upcomingAppointments[0];
  const stockCritical = lowStockItems.filter((item) => item.quantity <= Math.max(1, item.min * 0.5)).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
              <p className="text-muted-foreground">Visão operacional da clínica em tempo real.</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="capitalize">{today}</Badge>
              {nextAppointment ? (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Próximo: {nextAppointment.time}
                </Badge>
              ) : (
                <Badge variant="outline">Sem agendamentos para hoje</Badge>
              )}
            </div>
          </div>
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
                  <Card key={stat.title} className="border hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      {stat.change ? (
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">Atualizado agora</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <Card className="border">
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
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Nenhuma consulta agendada para hoje.
                      </div>
                    ) : (
                      upcomingAppointments.map((apt, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 hover:bg-muted/70 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 min-w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">{apt.time}</div>
                            <div>
                              <p className="font-medium">{apt.client}</p>
                              <p className="text-sm text-muted-foreground">{apt.pet} • {apt.service}</p>
                            </div>
                          </div>
                          <Badge variant="outline">Hoje</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Estoque Baixo
                    </CardTitle>
                    <CardDescription>
                      {lowStockItems.length === 0
                        ? "Sem itens críticos no momento."
                        : `${lowStockItems.length} item(ns) precisam de reposição`}
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto" asChild><Link to="/inventory">Ver Estoque</Link></Button>
                </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lowStockItems.length === 0 ? (
                      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                        <p className="text-sm flex items-center gap-2 text-success">
                          <CheckCircle2 className="h-4 w-4" />
                          Nenhum item com estoque baixo.
                        </p>
                      </div>
                    ) : (
                      lowStockItems.map((item, i) => {
                        const isCritical = item.quantity <= Math.max(1, item.min * 0.5);
                        return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Quantidade: {item.quantity} (mínimo: {item.min})</p>
                          </div>
                          <Badge variant={isCritical ? "destructive" : "outline"} className="gap-1">
                            {isCritical ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                            {isCritical ? "Crítico" : "Atenção"}
                          </Badge>
                        </div>
                      )})
                    )}
                  </div>
                  {stockCritical > 0 ? (
                    <p className="text-xs text-muted-foreground mt-4">
                      {stockCritical} item(ns) estão abaixo de 50% do mínimo recomendado.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
