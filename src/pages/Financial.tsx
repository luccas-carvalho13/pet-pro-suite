import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";

const Financial = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const revenues = [
    { id: 1, date: "2024-01-15", description: "Consulta - Max (Golden)", type: "Serviço", value: 150.00, status: "paid" },
    { id: 2, date: "2024-01-15", description: "Banho e Tosa - Luna (Poodle)", type: "Serviço", value: 80.00, status: "paid" },
    { id: 3, date: "2024-01-16", description: "Ração Premium 15kg", type: "Produto", value: 159.90, status: "pending" },
    { id: 4, date: "2024-01-16", description: "Vacinação V10 - Thor (Pastor)", type: "Serviço", value: 90.00, status: "paid" },
  ];

  const expenses = [
    { id: 1, date: "2024-01-10", description: "Fornecedor - Ração Pet Food", category: "Compras", value: 2500.00 },
    { id: 2, date: "2024-01-12", description: "Energia Elétrica", category: "Operacional", value: 450.00 },
    { id: 3, date: "2024-01-15", description: "Medicamentos Diversos", category: "Compras", value: 890.00 },
    { id: 4, date: "2024-01-15", description: "Salários", category: "Pessoal", value: 8500.00 },
  ];

  const stats = [
    { label: "Receita Total (Mês)", value: "R$ 15.480", icon: TrendingUp, color: "text-green-500" },
    { label: "Despesas (Mês)", value: "R$ 12.340", icon: TrendingDown, color: "text-red-500" },
    { label: "Lucro Líquido", value: "R$ 3.140", icon: DollarSign, color: "text-primary" },
    { label: "Caixa Atual", value: "R$ 8.920", icon: Wallet, color: "text-blue-500" },
  ];

  const getStatusBadge = (status: string) => {
    return status === "paid" 
      ? <Badge className="bg-green-500">Pago</Badge>
      : <Badge className="bg-orange-500">Pendente</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">Controle completo de receitas e despesas</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.map((revenue) => (
                      <TableRow key={revenue.id}>
                        <TableCell>{new Date(revenue.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{revenue.description}</TableCell>
                        <TableCell>{revenue.type}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          R$ {revenue.value.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">{getStatusBadge(revenue.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">
                          -R$ {expense.value.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Financial;
