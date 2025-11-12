import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const products = [
    { id: 1, name: "Ração Premium Cães", category: "Alimentos", stock: 45, minStock: 20, price: 159.90, status: "normal" },
    { id: 2, name: "Ração Premium Gatos", category: "Alimentos", stock: 15, minStock: 20, price: 139.90, status: "low" },
    { id: 3, name: "Shampoo Antipulgas", category: "Higiene", stock: 8, minStock: 15, price: 45.90, status: "critical" },
    { id: 4, name: "Coleira Ajustável", category: "Acessórios", stock: 30, minStock: 10, price: 29.90, status: "normal" },
    { id: 5, name: "Vacina Antirrábica", category: "Medicamentos", stock: 50, minStock: 25, price: 85.00, status: "normal" },
    { id: 6, name: "Areia Sanitária", category: "Higiene", stock: 12, minStock: 20, price: 34.90, status: "low" },
  ];

  const stats = [
    { label: "Total de Produtos", value: "156", icon: Package, color: "text-primary" },
    { label: "Estoque Baixo", value: "12", icon: AlertTriangle, color: "text-orange-500" },
    { label: "Entrada (Mês)", value: "+234", icon: TrendingUp, color: "text-green-500" },
    { label: "Saída (Mês)", value: "-189", icon: TrendingDown, color: "text-red-500" },
  ];

  const getStockBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "low":
        return <Badge className="bg-orange-500">Baixo</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-muted-foreground">Controle completo de produtos e movimentações</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Produto
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
            <CardTitle>Produtos em Estoque</CardTitle>
            <CardDescription>Lista completa de produtos cadastrados</CardDescription>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-center">{product.stock}</TableCell>
                    <TableCell className="text-center">{product.minStock}</TableCell>
                    <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{getStockBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
