import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  createCashEntry,
  getCashbook,
  getPendingAppointmentPayments,
  payAppointment,
  type AppointmentPaymentPayload,
  type PendingAppointmentPayment,
} from "@/lib/api";

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão Crédito",
  debit_card: "Cartão Débito",
  bank_transfer: "Transferência",
  other: "Outro",
};

const CashRegister = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [entryType, setEntryType] = useState<"all" | "inflow" | "outflow">("all");
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PendingAppointmentPayment | null>(null);

  const [entryForm, setEntryForm] = useState({
    entry_type: "inflow" as "inflow" | "outflow",
    amount: 0,
    description: "",
    payment_method: "pix" as "cash" | "pix" | "credit_card" | "debit_card" | "bank_transfer" | "other",
  });

  const [paymentForm, setPaymentForm] = useState<AppointmentPaymentPayload>({
    amount: undefined,
    payment_method: "pix",
    description: "",
  });

  const queryClient = useQueryClient();

  const { data: cashbook, isLoading: cashLoading, error: cashError } = useQuery({
    queryKey: ["cashbook", entryType, searchQuery],
    queryFn: () =>
      getCashbook({
        entry_type: entryType === "all" ? undefined : entryType,
        q: searchQuery,
        limit: 200,
      }),
  });

  const { data: pendingAppointments = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["cashbook", "pending-appointments"],
    queryFn: getPendingAppointmentPayments,
  });

  const createEntryMutation = useMutation({
    mutationFn: createCashEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashbook"] });
      toast.success("Lançamento de caixa criado.");
      setEntryDialogOpen(false);
      setEntryForm({ entry_type: "inflow", amount: 0, description: "", payment_method: "pix" });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao criar lançamento.");
    },
  });

  const payMutation = useMutation({
    mutationFn: (payload: { appointmentId: string; data: AppointmentPaymentPayload }) =>
      payAppointment(payload.appointmentId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashbook"] });
      toast.success("Pagamento registrado no caixa.");
      setPaymentDialogOpen(false);
      setSelectedAppointment(null);
      setPaymentForm({ amount: undefined, payment_method: "pix", description: "" });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar pagamento.");
    },
  });

  const stats = useMemo(() => {
    const fallback = {
      balance: 0,
      total_inflow: 0,
      total_outflow: 0,
      inflow_month: 0,
      outflow_month: 0,
    };
    return cashbook?.stats ?? fallback;
  }, [cashbook]);

  const openPaymentDialog = (appointment: PendingAppointmentPayment) => {
    setSelectedAppointment(appointment);
    setPaymentForm({
      amount: appointment.remaining,
      payment_method: "pix",
      description: `Pagamento - ${appointment.service_name} (${appointment.pet_name})`,
    });
    setPaymentDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Caixa e Pagamentos</h1>
            <p className="text-muted-foreground">Controle de entradas, saídas e recebimentos de agendamentos</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setEntryDialogOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Lançamento Manual
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <p className="text-2xl font-bold">R$ {stats.balance.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Entradas (Mês)</p>
              <p className="text-2xl font-bold text-green-600">R$ {stats.inflow_month.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saídas (Mês)</p>
              <p className="text-2xl font-bold text-red-600">R$ {stats.outflow_month.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Receber Agora</p>
              <p className="text-2xl font-bold">{pendingAppointments.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Movimentações do Caixa
            </CardTitle>
            <CardDescription>Histórico financeiro consolidado com método de pagamento</CardDescription>
            <div className="grid gap-3 md:grid-cols-[1fr,200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por descrição ou método"
                />
              </div>
              <Select value={entryType} onValueChange={(value) => setEntryType(value as "all" | "inflow" | "outflow")}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="inflow">Entradas</SelectItem>
                  <SelectItem value="outflow">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {cashError && <p className="text-sm text-destructive mb-4">Erro ao carregar caixa.</p>}
            {cashLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Método</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cashbook?.entries ?? []).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.occurred_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{entry.description}</TableCell>
                      <TableCell className="hidden md:table-cell">{PAYMENT_METHOD_LABEL[entry.payment_method] ?? entry.payment_method}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {entry.entry_type === "inflow" ? (
                          <Badge className="bg-green-600">Entrada</Badge>
                        ) : (
                          <Badge variant="destructive">Saída</Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${entry.entry_type === "inflow" ? "text-green-600" : "text-red-600"}`}>
                        {entry.entry_type === "inflow" ? "R$" : "-R$"} {entry.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agendamentos com Recebimento Pendente</CardTitle>
            <CardDescription>Registre pagamentos rapidamente direto no caixa</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente / Pet</TableHead>
                    <TableHead className="hidden lg:table-cell">Serviço</TableHead>
                    <TableHead className="text-right">Restante</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{new Date(appointment.scheduled_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">
                        {appointment.client_name}
                        <p className="text-xs text-muted-foreground">{appointment.pet_name}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{appointment.service_name}</TableCell>
                      <TableCell className="text-right">R$ {appointment.remaining.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openPaymentDialog(appointment)}>
                          Receber
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento de caixa</DialogTitle>
            <DialogDescription>Registre uma entrada ou saída manual.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={entryForm.entry_type} onValueChange={(value) => setEntryForm((f) => ({ ...f, entry_type: value as "inflow" | "outflow" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inflow">Entrada</SelectItem>
                  <SelectItem value="outflow">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Método</Label>
                <Select
                  value={entryForm.payment_method}
                  onValueChange={(value) =>
                    setEntryForm((f) => ({ ...f, payment_method: value as "cash" | "pix" | "credit_card" | "debit_card" | "bank_transfer" | "other" }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão Débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={entryForm.description}
                onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!entryForm.description.trim()) return toast.error("Descrição é obrigatória.");
                if (entryForm.amount <= 0) return toast.error("Valor inválido.");
                createEntryMutation.mutate(entryForm);
              }}
              disabled={createEntryMutation.isPending}
            >
              Salvar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
            <DialogDescription>
              {selectedAppointment
                ? `${selectedAppointment.client_name} • ${selectedAppointment.pet_name} • ${selectedAppointment.service_name}`
                : "Selecione um agendamento."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentForm.amount ?? 0}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Método</Label>
                <Select
                  value={paymentForm.payment_method ?? "pix"}
                  onValueChange={(value) =>
                    setPaymentForm((f) => ({ ...f, payment_method: value as "cash" | "pix" | "credit_card" | "debit_card" | "bank_transfer" | "other" }))
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão Débito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                value={paymentForm.description ?? ""}
                onChange={(e) => setPaymentForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!selectedAppointment) return;
                if (!paymentForm.amount || paymentForm.amount <= 0) return toast.error("Valor inválido.");
                payMutation.mutate({ appointmentId: selectedAppointment.id, data: paymentForm });
              }}
              disabled={payMutation.isPending}
            >
              Confirmar recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CashRegister;
