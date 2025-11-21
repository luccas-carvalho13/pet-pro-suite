import { useState } from "react";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar, Plus, Clock, User, Dog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { AppointmentDialog, ViewDetailsDialog } from "@/shared/components/dialogs";
import { appointmentsService, type Appointment } from "@/api/services/appointments.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

const Appointments = () => {
  const { tenantId, userId, user } = useAuth();
  const { can } = usePermissions(tenantId || undefined, user?.role);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const canCreate = can("appointments", "create");
  const canEdit = can("appointments", "edit");
  const canDelete = can("appointments", "delete");
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const queryClient = useQueryClient();

  const dateString = format(selectedDate, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");

  // Buscar agendamentos do dia selecionado
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", tenantId, dateString],
    queryFn: () => {
      if (!tenantId) return [];
      return appointmentsService.getAll(tenantId, { date: dateString });
    },
    enabled: !!tenantId,
  });

  // Buscar agendamentos da semana
  const { data: weekAppointments = [] } = useQuery({
    queryKey: ["appointments", "week", tenantId, weekStart, weekEnd],
    queryFn: async () => {
      if (!tenantId) return [];
      const allAppointments = await appointmentsService.getAll(tenantId);
      return allAppointments.filter((apt: Appointment) => {
        const aptDate = apt.date;
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
    },
    enabled: !!tenantId,
  });

  // Buscar agendamentos do mês
  const { data: monthAppointments = [] } = useQuery({
    queryKey: ["appointments", "month", tenantId, monthStart, monthEnd],
    queryFn: async () => {
      if (!tenantId) return [];
      const allAppointments = await appointmentsService.getAll(tenantId);
      return allAppointments.filter((apt: Appointment) => {
        const aptDate = apt.date;
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
    },
    enabled: !!tenantId,
  });

  // Criar agendamento
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof appointmentsService.create>[2]) => {
      if (!tenantId || !userId) throw new Error("Tenant ID ou User ID não encontrado");
      return appointmentsService.create(tenantId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
      setAppointmentDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar agendamento");
    },
  });

  // Atualizar agendamento
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof appointmentsService.update>[2] }) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return appointmentsService.update(id, tenantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado com sucesso!");
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar agendamento");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      confirmed: { label: "Confirmado", variant: "default" },
      in_progress: { label: "Em Andamento", variant: "secondary" },
      scheduled: { label: "Agendado", variant: "outline" },
      completed: { label: "Concluído", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const { label, variant } = variants[status] || { label: status, variant: "outline" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return `${diff} min`;
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDialogOpen(true);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setAppointmentDialogOpen(true);
  };

  const handleSaveAppointment = async (data: any) => {
    if (selectedAppointment) {
      updateMutation.mutate({ id: selectedAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Calcular estatísticas
  const todayAppointments = appointments.length;
  const confirmedToday = appointments.filter(a => a.status === "confirmed").length;
  const thisWeek = weekAppointments.length;
  const thisMonth = monthAppointments.length;
  const occupancyRate = todayAppointments > 0 ? Math.round((confirmedToday / todayAppointments) * 100) : 0;

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
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie consultas, banhos e procedimentos</p>
          </div>
          {canCreate && (
            <Button className="gradient-primary shadow-primary" onClick={handleNewAppointment}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayAppointments}</div>
              <p className="text-xs text-muted-foreground mt-1">{confirmedToday} confirmados</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{thisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Agendamentos</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{thisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</CardTitle>
              <Clock className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Hoje</p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
                    >
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Carregando agendamentos...</p>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appointment) => {
                      const client = (appointment as any).clients;
                      const pet = (appointment as any).pets;
                      const service = (appointment as any).services;
                      const vet = (appointment as any).veterinarians;
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-4 p-4 rounded-lg border-2 hover:border-primary/50 transition-all bg-card"
                        >
                          <div className="flex flex-col items-center gap-1 min-w-[80px]">
                            <span className="text-2xl font-bold text-primary">{appointment.start_time}</span>
                            <span className="text-xs text-muted-foreground">
                              {calculateDuration(appointment.start_time, appointment.end_time)}
                            </span>
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{service?.name || "Serviço"}</h4>
                                {getStatusBadge(appointment.status)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{client?.name || "Cliente"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Dog className="h-4 w-4" />
                                <span>
                                  {pet?.name || "Pet"} ({pet?.species === "dog" ? "Cachorro" : pet?.species === "cat" ? "Gato" : pet?.species || ""})
                                </span>
                              </div>
                            </div>

                            {vet && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Profissional: {vet.name}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(appointment)}>
                              Ver Detalhes
                            </Button>
                            {canEdit && (
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(appointment)}>
                                Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Semana de {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "dd/MM")} a {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 86400000))}
                    >
                      Semana Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Esta Semana
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))}
                    >
                      Próxima Semana
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {weekAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    Nenhum agendamento nesta semana
                  </p>
                ) : (
                  <div className="space-y-3">
                    {weekAppointments.map((appointment: Appointment) => {
                      const client = (appointment as any).clients;
                      const pet = (appointment as any).pets;
                      const service = (appointment as any).services;
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-4 p-4 rounded-lg border-2 hover:border-primary/50 transition-all bg-card"
                        >
                          <div className="flex flex-col items-center gap-1 min-w-[100px]">
                            <span className="text-sm font-medium text-muted-foreground">
                              {format(new Date(appointment.date), "dd/MM")}
                            </span>
                            <span className="text-xl font-bold text-primary">{appointment.start_time}</span>
                            <span className="text-xs text-muted-foreground">
                              {calculateDuration(appointment.start_time, appointment.end_time)}
                            </span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{service?.name || "Serviço"}</h4>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>{client?.name || "Cliente"}</span> - <span>{pet?.name || "Pet"}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(appointment)}>
                              Ver Detalhes
                            </Button>
                            {canEdit && (
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(appointment)}>
                                Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {format(selectedDate, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      Mês Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                      Este Mês
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                    >
                      Próximo Mês
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">
                    Nenhum agendamento neste mês
                  </p>
                ) : (
                  <div className="space-y-3">
                    {monthAppointments.map((appointment: Appointment) => {
                      const client = (appointment as any).clients;
                      const pet = (appointment as any).pets;
                      const service = (appointment as any).services;
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-4 p-4 rounded-lg border-2 hover:border-primary/50 transition-all bg-card"
                        >
                          <div className="flex flex-col items-center gap-1 min-w-[100px]">
                            <span className="text-sm font-medium text-muted-foreground">
                              {format(new Date(appointment.date), "dd/MM")}
                            </span>
                            <span className="text-xl font-bold text-primary">{appointment.start_time}</span>
                            <span className="text-xs text-muted-foreground">
                              {calculateDuration(appointment.start_time, appointment.end_time)}
                            </span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{service?.name || "Serviço"}</h4>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>{client?.name || "Cliente"}</span> - <span>{pet?.name || "Pet"}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(appointment)}>
                              Ver Detalhes
                            </Button>
                            {canEdit && (
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(appointment)}>
                                Editar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AppointmentDialog
        open={appointmentDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          setAppointmentDialogOpen(open);
          setEditDialogOpen(open);
          if (!open) setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
      />

      <ViewDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        title="Detalhes do Agendamento"
        data={selectedAppointment || {}}
        onEdit={() => {
          setDetailsDialogOpen(false);
          handleEdit(selectedAppointment!);
        }}
      />
    </DashboardLayout>
  );
};

export default Appointments;
