import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, User, Dog, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createAppointment, deleteAppointment, getAppointments, getClients, getPets, getServices, updateAppointment, type Appointment, type Client, type Pet, type Service } from "@/lib/api";
import { toast } from "sonner";

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    client_id: "",
    pet_id: "",
    service_id: "",
    scheduled_at: "",
    duration_minutes: 30,
    status: "scheduled",
    vet_name: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: getClients });
  const { data: pets = [] } = useQuery({ queryKey: ["pets"], queryFn: getPets });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: getServices });

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar agendamento.";
      toast.error(msg);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: typeof form }) => updateAppointment(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar agendamento.";
      toast.error(msg);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao remover agendamento.";
      toast.error(msg);
    },
  });

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
  const formatPart = (value: number) => String(value).padStart(2, "0");
  const toLocalInput = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${formatPart(d.getMonth() + 1)}-${formatPart(d.getDate())}T${formatPart(d.getHours())}:${formatPart(d.getMinutes())}`;
  };
  const toIsoFromLocalInput = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };
  const toPtBrTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  const getAppointmentTime = (apt: Appointment) => {
    const localTime = toPtBrTime(apt.scheduledAt);
    return localTime || apt.time;
  };
  const toDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const startOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  const endOfWeek = (d: Date) => {
    const start = startOfWeek(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const selectedDayAppointments = appointments.filter((a: Appointment) =>
    isSameDay(new Date(a.scheduledAt), selectedDate)
  );
  const todayCount = selectedDayAppointments.length;
  const confirmedToday = selectedDayAppointments.filter((a: Appointment) => a.status === "confirmed").length;
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekCount = appointments.filter((a: Appointment) => {
    const d = new Date(a.scheduledAt);
    return d >= weekStart && d <= weekEnd;
  }).length;
  const monthCount = appointments.filter((a: Appointment) => {
    const d = new Date(a.scheduledAt);
    return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
  }).length;
  const appointmentsByDay = appointments.reduce((acc: Record<string, Appointment[]>, a: Appointment) => {
    const key = toDayKey(new Date(a.scheduledAt));
    acc[key] = acc[key] ? [...acc[key], a] : [a];
    return acc;
  }, {});
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const monthOffset = (monthStart.getDay() + 6) % 7;
  const monthCells: Array<Date | null> = Array.from(
    { length: monthOffset + monthEnd.getDate() },
    (_, i) => {
      if (i < monthOffset) return null;
      const day = i - monthOffset + 1;
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    },
  );
  while (monthCells.length % 7 !== 0) monthCells.push(null);
  const monthWeeks = Array.from({ length: monthCells.length / 7 }, (_, i) =>
    monthCells.slice(i * 7, i * 7 + 7),
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      confirmed: { label: "Confirmado", variant: "default" },
      "in-progress": { label: "Em Andamento", variant: "secondary" },
      pending: { label: "Pendente", variant: "outline" },
      scheduled: { label: "Agendado", variant: "outline" },
      completed: { label: "Concluído", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const v = variants[status] ?? variants.pending;
    return <Badge variant={v.variant}>{v.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie consultas, banhos e procedimentos</p>
          </div>
          <Button
            className="gradient-primary shadow-primary w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setForm({
                client_id: clients[0]?.id ?? "",
                pet_id: pets[0]?.id ?? "",
                service_id: services[0]?.id ?? "",
                scheduled_at: "",
                duration_minutes: 30,
                status: "scheduled",
                vet_name: "",
                notes: "",
              });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "–" : todayCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{confirmedToday} confirmados</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "–" : weekCount}</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
              <Calendar className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "–" : monthCount}</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</CardTitle>
              <Clock className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">–</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="day" className="space-y-4">
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>

          <TabsContent value="day" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>
                    {selectedDate.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && <p className="text-destructive text-sm">Erro ao carregar agendamentos.</p>}
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayAppointments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhum agendamento para exibir.</p>
                    ) : (
                      selectedDayAppointments.map((apt: Appointment) => (
                        <div
                          key={apt.id}
                          className="flex flex-col gap-4 sm:flex-row sm:items-start p-4 rounded-lg border-2 hover:border-primary/50 transition-all bg-card"
                        >
                          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 min-w-[80px]">
                            <span className="text-2xl font-bold text-primary">{getAppointmentTime(apt)}</span>
                            <span className="text-xs text-muted-foreground">{apt.duration}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{apt.service}</h4>
                                {getStatusBadge(apt.status)}
                              </div>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{apt.client}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Dog className="h-4 w-4" />
                                <span>{apt.pet} ({apt.petType})</span>
                              </div>
                            </div>
                            {apt.vet && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Profissional: {apt.vet}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 sm:items-end">
                            <Button
                              size="icon"
                              variant="outline"
                              title="Editar"
                              aria-label="Editar"
                              onClick={() => {
                                setEditing(apt);
                                setForm({
                                  client_id: apt.client_id,
                                  pet_id: apt.pet_id,
                                  service_id: apt.service_id,
                                  scheduled_at: apt.scheduledAt ? toLocalInput(apt.scheduledAt) : "",
                                  duration_minutes: Number(apt.duration.replace(" min", "")) || 30,
                                  status: apt.status === "pending" ? "scheduled" : apt.status === "in-progress" ? "in_progress" : apt.status,
                                  vet_name: apt.vet ?? "",
                                  notes: "",
                                });
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Excluir"
                              aria-label="Excluir"
                              onClick={() => {
                                if (window.confirm("Remover este agendamento?")) deleteMutation.mutate(apt.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>
                    Semana de{" "}
                    {weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}{" "}
                    a{" "}
                    {weekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))
                      }
                    >
                      Semana anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))
                      }
                    >
                      Próxima semana
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {weekDays.map((day) => {
                    const key = toDayKey(day);
                    const items = appointmentsByDay[key] ?? [];
                    return (
                      <div key={key} className="rounded-lg border bg-muted/40 p-4">
                        <button
                          className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-semibold transition-colors ${isSameDay(day, selectedDate) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <span>
                            {day.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                          </span>
                          <span className="text-xs text-muted-foreground">{items.length} ag.</span>
                        </button>
                        <div className="mt-3 space-y-2">
                          {items.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Sem agendamentos.</p>
                          ) : (
                            items.map((apt) => (
                              <div key={apt.id} className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-xs shadow-sm">
                                <div className="flex flex-col">
                                  <span className="font-semibold">{getAppointmentTime(apt)}</span>
                                  <span className="text-muted-foreground">{apt.pet}</span>
                                </div>
                                {getStatusBadge(apt.status)}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>
                    {selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
                      }
                    >
                      Mês anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
                      }
                    >
                      Próximo mês
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground mb-3">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
                    <div key={label} className="text-center font-medium">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="grid gap-2">
                  {monthWeeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 gap-2">
                      {week.map((day, di) => {
                        if (!day) return <div key={`${wi}-${di}`} className="h-20 rounded-lg bg-muted/30" />;
                        const key = toDayKey(day);
                        const items = appointmentsByDay[key] ?? [];
                        const isSelected = isSameDay(day, selectedDate);
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedDate(day)}
                            className={`h-20 rounded-lg border bg-card p-2 text-left transition-colors hover:border-primary/40 ${isSelected ? "ring-2 ring-primary/60" : ""}`}
                          >
                            <div className="text-sm font-semibold">{day.getDate()}</div>
                            <div className="text-xs text-muted-foreground">
                              {items.length ? `${items.length} ag.` : "–"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
            <DialogDescription>Informe os dados da consulta.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => {
                  const firstPet = pets.find((p: Pet) => p.client_id === v);
                  setForm((f) => ({ ...f, client_id: v, pet_id: firstPet?.id ?? "" }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: Client) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pet</Label>
              <Select value={form.pet_id} onValueChange={(v) => setForm((f) => ({ ...f, pet_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger>
                <SelectContent>
                  {pets
                    .filter((p: Pet) => !form.client_id || p.client_id === form.client_id)
                    .map((p: Pet) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Select value={form.service_id} onValueChange={(v) => setForm((f) => ({ ...f, service_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o serviço" /></SelectTrigger>
                <SelectContent>
                  {services.map((s: Service) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Data e hora</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Profissional</Label>
                <Input
                  value={form.vet_name}
                  onChange={(e) => setForm((f) => ({ ...f, vet_name: e.target.value }))}
                  placeholder="Nome do profissional"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.client_id || !form.pet_id || !form.service_id) return toast.error("Cliente, pet e serviço são obrigatórios.");
                if (!form.scheduled_at) return toast.error("Data e hora são obrigatórias.");
                const scheduledAtIso = toIsoFromLocalInput(form.scheduled_at);
                if (!scheduledAtIso) return toast.error("Data e hora inválidas.");
                const payload = { ...form, scheduled_at: scheduledAtIso };
                if (editing) {
                  updateMutation.mutate({ id: editing.id, data: payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Appointments;
