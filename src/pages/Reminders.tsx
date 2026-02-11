import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, BellRing, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelReminder, getReminders, processDueReminders, type ReminderJob } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "sent", label: "Enviados" },
  { value: "failed", label: "Falhados" },
  { value: "cancelled", label: "Cancelados" },
] as const;

const statusBadge = (status: ReminderJob["status"]) => {
  if (status === "pending") return <Badge className="bg-amber-500">Pendente</Badge>;
  if (status === "sent") return <Badge className="bg-green-600">Enviado</Badge>;
  if (status === "failed") return <Badge variant="destructive">Falhou</Badge>;
  return <Badge variant="outline">Cancelado</Badge>;
};

const Reminders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading, error } = useQuery({
    queryKey: ["reminders", statusFilter, searchQuery],
    queryFn: () =>
      getReminders({
        status: statusFilter === "all" ? undefined : statusFilter,
        q: searchQuery,
        limit: 200,
      }),
  });

  const processMutation = useMutation({
    mutationFn: () => processDueReminders(100),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success(`${result.processed} lembrete(s) processado(s).`);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao processar lembretes.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Lembrete cancelado.");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar lembrete.");
    },
  });

  const stats = useMemo(() => ({
    total: reminders.length,
    pending: reminders.filter((r) => r.status === "pending").length,
    sent: reminders.filter((r) => r.status === "sent").length,
    failed: reminders.filter((r) => r.status === "failed").length,
  }), [reminders]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lembretes Automáticos</h1>
            <p className="text-muted-foreground">Fila de lembretes de consultas para clientes</p>
          </div>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
          >
            <PlayCircle className="h-4 w-4" />
            Processar Pendentes
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Enviados</p>
              <p className="text-2xl font-bold">{stats.sent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Falhas</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Fila de Lembretes
            </CardTitle>
            <CardDescription>Acompanhe o status e reprocessamento dos envios</CardDescription>
            <div className="grid gap-3 md:grid-cols-[1fr,220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por tutor, pet ou tipo"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as (typeof STATUS_OPTIONS)[number]["value"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive mb-4">Erro ao carregar lembretes.</p>}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agendado para</TableHead>
                    <TableHead>Cliente / Pet</TableHead>
                    <TableHead className="hidden md:table-cell">Consulta</TableHead>
                    <TableHead className="hidden md:table-cell">Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>{new Date(reminder.scheduled_for).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">
                        {reminder.client_name || "Sem tutor"}
                        <p className="text-xs text-muted-foreground">{reminder.pet_name || "Sem pet"}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {reminder.appointment_at ? new Date(reminder.appointment_at).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{reminder.channel}</TableCell>
                      <TableCell>{statusBadge(reminder.status)}</TableCell>
                      <TableCell className="text-right">
                        {reminder.status === "pending" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate(reminder.id)}
                          >
                            Cancelar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reminders;
