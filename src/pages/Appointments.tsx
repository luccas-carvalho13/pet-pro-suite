import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, User, Dog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const appointments = [
    {
      id: 1,
      time: "09:00",
      duration: "30 min",
      client: "Maria Silva",
      pet: "Rex",
      petType: "Cachorro",
      service: "Consulta de Rotina",
      status: "confirmed",
      vet: "Dr. João",
    },
    {
      id: 2,
      time: "10:00",
      duration: "15 min",
      client: "João Santos",
      pet: "Mimi",
      petType: "Gato",
      service: "Vacinação",
      status: "confirmed",
      vet: "Dr. João",
    },
    {
      id: 3,
      time: "11:00",
      duration: "45 min",
      client: "Ana Costa",
      pet: "Bob",
      petType: "Cachorro",
      service: "Banho e Tosa",
      status: "in-progress",
      vet: "Maria",
    },
    {
      id: 4,
      time: "14:00",
      duration: "30 min",
      client: "Carlos Lima",
      pet: "Luna",
      petType: "Cachorro",
      service: "Consulta",
      status: "pending",
      vet: "Dr. João",
    },
    {
      id: 5,
      time: "15:00",
      duration: "30 min",
      client: "Paula Santos",
      pet: "Thor",
      petType: "Cachorro",
      service: "Retorno",
      status: "confirmed",
      vet: "Dra. Ana",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: { label: "Confirmado", variant: "default" as const },
      "in-progress": { label: "Em Andamento", variant: "secondary" as const },
      pending: { label: "Pendente", variant: "outline" as const },
      completed: { label: "Concluído", variant: "secondary" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    const { label, variant } = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie consultas, banhos e procedimentos</p>
          </div>
          <Button className="gradient-primary shadow-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hoje
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">5 confirmados</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Esta Semana
              </CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">68</div>
              <p className="text-xs text-muted-foreground mt-1">+15% vs. semana anterior</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Este Mês
              </CardTitle>
              <Calendar className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">284</div>
              <p className="text-xs text-muted-foreground mt-1">Meta: 300</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Ocupação
              </CardTitle>
              <Clock className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground mt-1">Acima da média</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Tabs defaultValue="day" className="space-y-4">
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Anterior</Button>
                    <Button variant="outline" size="sm">Hoje</Button>
                    <Button variant="outline" size="sm">Próximo</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-4 p-4 rounded-lg border-2 hover:border-primary/50 transition-all bg-card"
                    >
                      <div className="flex flex-col items-center gap-1 min-w-[80px]">
                        <span className="text-2xl font-bold text-primary">{appointment.time}</span>
                        <span className="text-xs text-muted-foreground">{appointment.duration}</span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{appointment.service}</h4>
                            {getStatusBadge(appointment.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{appointment.client}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Dog className="h-4 w-4" />
                            <span>{appointment.pet} ({appointment.petType})</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Profissional: {appointment.vet}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline">Ver Detalhes</Button>
                        <Button size="sm" variant="ghost">Editar</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Visualização Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Visualização de semana em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Visualização Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Visualização de mês em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Appointments;
