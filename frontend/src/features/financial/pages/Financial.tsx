import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";
import { TransactionDialog } from "@/shared/components/dialogs";
import { financialTransactionsService, type FinancialTransaction } from "@/api/services/financial-transactions.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

const Financial = () => {
  const { tenantId, userId, user } = useAuth();
  const { can } = usePermissions(tenantId || undefined, user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  
  const canCreate = can("financial", "create");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const queryClient = useQueryClient();

  const startOfCurrentMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endOfCurrentMonth = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // Buscar estatísticas financeiras
  const { data: financialStats } = useQuery({
    queryKey: ["financial", "stats", tenantId, startOfCurrentMonth, endOfCurrentMonth],
    queryFn: () => {
      if (!tenantId) return { totalIncome: 0, totalExpenses: 0, balance: 0 };
      return financialTransactionsService.getStats(tenantId, startOfCurrentMonth, endOfCurrentMonth);
    },
    enabled: !!tenantId,
  });

  // Buscar receitas
  const { data: revenues = [], isLoading: loadingRevenues } = useQuery({
    queryKey: ["financial", "revenues", tenantId, startOfCurrentMonth, endOfCurrentMonth],
    queryFn: () => {
      if (!tenantId) return [];
      return financialTransactionsService.getAll(tenantId, {
        type: "income",
        startDate: startOfCurrentMonth,
        endDate: endOfCurrentMonth,
      });
    },
    enabled: !!tenantId,
  });

  // Buscar despesas
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ["financial", "expenses", tenantId, startOfCurrentMonth, endOfCurrentMonth],
    queryFn: () => {
      if (!tenantId) return [];
      return financialTransactionsService.getAll(tenantId, {
        type: "expense",
        startDate: startOfCurrentMonth,
        endDate: endOfCurrentMonth,
      });
    },
    enabled: !!tenantId,
  });

  // Criar transação
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof financialTransactionsService.create>[2]) => {
      if (!tenantId || !userId) throw new Error("Tenant ID ou User ID não encontrado");
      return financialTransactionsService.create(tenantId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      toast.success("Transação registrada com sucesso!");
      setTransactionDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar transação");
    },
  });

  const stats = [
    {
      label: "Receita Total (Mês)",
      value: `R$ ${(financialStats?.totalIncome || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Despesas (Mês)",
      value: `R$ ${(financialStats?.totalExpenses || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingDown,
      color: "text-red-500",
    },
    {
      label: "Lucro Líquido",
      value: `R$ ${(financialStats?.balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      label: "Caixa Atual",
      value: `R$ ${(financialStats?.balance || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: "text-blue-500",
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === "paid" ? <Badge className="bg-green-500">Pago</Badge> : <Badge className="bg-orange-500">Pendente</Badge>;
  };

  const handleNewTransaction = (type: "income" | "expense") => {
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };

  const handleSaveTransaction = async (data: any) => {
    createMutation.mutate(data);
  };

  // Filtrar receitas e despesas
  const filteredRevenues = revenues.filter((revenue) =>
    revenue.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">Controle completo de receitas e despesas</p>
          </div>
          {canCreate && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => handleNewTransaction("expense")}>
                <Plus className="h-4 w-4" />
                Nova Despesa
              </Button>
              <Button className="gap-2" onClick={() => handleNewTransaction("income")}>
                <Plus className="h-4 w-4" />
                Nova Receita
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Movimentações Financeiras</CardTitle>
            <CardDescription>Histórico de receitas e despesas</CardDescription>
          </CardHeader>
          <CardContent>
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
                {loadingRevenues ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Carregando receitas...</p>
                  </div>
                ) : filteredRevenues.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Nenhuma receita encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRevenues.map((revenue) => (
                        <TableRow key={revenue.id}>
                          <TableCell>{new Date(revenue.date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="font-medium">{revenue.description}</TableCell>
                          <TableCell>{revenue.category}</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            R$ {Number(revenue.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500">Pago</Badge>
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
                {loadingExpenses ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Carregando despesas...</p>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            -R$ {Number(expense.amount).toFixed(2)}
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

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        type={transactionType}
        onSave={handleSaveTransaction}
      />
    </DashboardLayout>
  );
};

export default Financial;
