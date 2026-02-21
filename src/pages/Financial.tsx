import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Wallet, Pencil, Trash2 } from "lucide-react";
import { createTransaction, deleteTransaction, getTransactions, updateTransaction, type TransactionRevenue, type TransactionExpense } from "@/lib/api";
import { toast } from "sonner";

const Financial = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; type: "revenue" | "expense" } | null>(null);
  const [form, setForm] = useState({
    type: "revenue",
    date: "",
    description: "",
    category: "",
    value: 0,
    status: "paid",
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação criada!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar transação.";
      toast.error(msg);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { type: "revenue" | "expense"; date: string; description: string; category?: string; value: number; status?: string } }) =>
      updateTransaction(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação atualizada!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar transação.";
      toast.error(msg);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação removida.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao remover transação.";
      toast.error(msg);
    },
  });

  const stats = data?.stats ?? [];
  const revenues = data?.revenues ?? [];
  const expenses = data?.expenses ?? [];

  const filteredRevenues = revenues.filter((r: TransactionRevenue) =>
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredExpenses = expenses.filter((e: TransactionExpense) =>
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) =>
    status === "paid"
      ? <Badge className="bg-success text-success-foreground">Pago</Badge>
      : <Badge className="bg-warning text-warning-foreground">Pendente</Badge>;

  const iconMap: Record<string, typeof TrendingUp> = {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">Controle completo de receitas e despesas</p>
          </div>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setForm({ type: "revenue", date: "", description: "", category: "", value: 0, status: "paid" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((s) => {
            const Icon = iconMap[s.icon] ?? DollarSign;
            return (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{isLoading ? "–" : s.value}</p>
                    </div>
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Movimentações Financeiras</CardTitle>
            <CardDescription>Histórico de receitas e despesas</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive text-sm mb-4">Erro ao carregar transações.</p>}
            <Tabs defaultValue="revenues" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="revenues">Receitas</TabsTrigger>
                <TabsTrigger value="expenses">Despesas</TabsTrigger>
              </TabsList>

              <TabsContent value="revenues" className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar receitas..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="hidden md:table-cell">Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRevenues.map((r: TransactionRevenue) => (
                        <TableRow key={r.id}>
                          <TableCell>{new Date(r.date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="font-medium">{r.description}</TableCell>
                          <TableCell className="hidden md:table-cell">{r.type}</TableCell>
                          <TableCell className="text-right text-success font-semibold">R$ {Number(r.value).toFixed(2)}</TableCell>
                          <TableCell className="text-center hidden md:table-cell">{getStatusBadge(r.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar"
                                aria-label="Editar"
                                onClick={() => {
                                  setEditing({ id: r.id, type: "revenue" });
                                  setForm({
                                    type: "revenue",
                                    date: r.date,
                                    description: r.description,
                                    category: "",
                                    value: r.value,
                                    status: r.status ?? "paid",
                                  });
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                                aria-label="Excluir"
                                onClick={() => {
                                  if (window.confirm("Remover esta transação?")) deleteMutation.mutate(r.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar despesas..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Carregando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="hidden md:table-cell">Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((e: TransactionExpense) => (
                        <TableRow key={e.id}>
                          <TableCell>{new Date(e.date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="font-medium">{e.description}</TableCell>
                          <TableCell className="hidden md:table-cell"><Badge variant="outline">{e.category}</Badge></TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">-R$ {Number(e.value).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar"
                                aria-label="Editar"
                                onClick={() => {
                                  setEditing({ id: e.id, type: "expense" });
                                  setForm({
                                    type: "expense",
                                    date: e.date,
                                    description: e.description,
                                    category: e.category ?? "",
                                    value: e.value,
                                    status: "",
                                  });
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Excluir"
                                aria-label="Excluir"
                                onClick={() => {
                                  if (window.confirm("Remover esta transação?")) deleteMutation.mutate(e.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar transação" : "Nova transação"}</DialogTitle>
            <DialogDescription>Informe os dados financeiros.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input type="number" step="0.01" min={0} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            {form.type === "expense" && (
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
            )}
            {form.type === "revenue" && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.date) return toast.error("Data é obrigatória.");
                if (!form.description.trim()) return toast.error("Descrição é obrigatória.");
                if (form.value < 0) return toast.error("Valor inválido.");
                const payload = {
                  type: form.type as "revenue" | "expense",
                  date: form.date,
                  description: form.description,
                  category: form.type === "expense" ? form.category : undefined,
                  value: form.value,
                  status: form.type === "revenue" ? form.status : undefined,
                };
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

export default Financial;
