import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, Calendar, DollarSign, TrendingUp, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const stats = [
    {
      title: "Consultas Hoje",
      value: "12",
      change: "+3 desde ontem",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Clientes Ativos",
      value: "248",
      change: "+18 este mês",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Faturamento Mensal",
      value: "R$ 24.580",
      change: "+12% vs. mês anterior",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Taxa de Ocupação",
      value: "87%",
      change: "Acima da média",
      icon: TrendingUp,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  const upcomingAppointments = [
    { time: "09:00", client: "Maria Silva", pet: "Rex", service: "Consulta" },
    { time: "10:30", client: "João Santos", pet: "Mimi", service: "Vacina" },
    { time: "11:00", client: "Ana Costa", pet: "Bob", service: "Banho e Tosa" },
    { time: "14:00", client: "Carlos Lima", pet: "Luna", service: "Consulta" },
  ];

  const lowStockItems = [
    { name: "Ração Premium 15kg", quantity: 3, min: 5 },
    { name: "Antipulgas", quantity: 2, min: 5 },
    { name: "Shampoo Hipoalergênico", quantity: 1, min: 3 },
  ];

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
                <Button size="sm" variant="outline">Ver Todas</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                        {appointment.time}
                      </div>
                      <div>
                        <p className="font-medium">{appointment.client}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.pet} - {appointment.service}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="border-2 border-warning/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-warning" />
                    Estoque Baixo
                  </CardTitle>
                  <CardDescription>Itens que precisam de reposição</CardDescription>
                </div>
                <Button size="sm" variant="outline">Ver Estoque</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity} (mínimo: {item.min})
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-warning border-warning/50">
                      Repor
                    </Button>
                  </div>
                ))}
              </div>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span>Nova Consulta</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Users className="h-5 w-5" />
                <span>Novo Cliente</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <Package className="h-5 w-5" />
                <span>Entrada Estoque</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <DollarSign className="h-5 w-5" />
                <span>Registrar Venda</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
