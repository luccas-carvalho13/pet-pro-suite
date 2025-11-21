import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Plus, Search, Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { ProductDialog } from "@/shared/components/dialogs";
import { productsService, type Product } from "@/api/services/products.service";
import { stockMovementsService } from "@/api/services/stock-movements.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";
import { format } from "date-fns";

const Inventory = () => {
  const { tenantId, userId, user } = useAuth();
  const { can } = usePermissions(tenantId || undefined, user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  
  const canCreate = can("inventory", "create");
  const canEdit = can("inventory", "edit");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  // Buscar produtos
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return productsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar produtos com estoque baixo
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["products", "low-stock", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return productsService.getLowStock(tenantId);
    },
    enabled: !!tenantId,
  });

  // Criar produto
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof productsService.create>[2]) => {
      if (!tenantId || !userId) throw new Error("Tenant ID ou User ID não encontrado");
      return productsService.create(tenantId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
      setProductDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar produto");
    },
  });

  // Atualizar produto
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof productsService.update>[2] }) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return productsService.update(id, tenantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  // Filtrar produtos
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockBadge = (product: Product) => {
    if (product.stock <= 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (product.stock <= product.min_stock) {
      return <Badge className="bg-orange-500">Baixo</Badge>;
    }
    return <Badge variant="secondary">Normal</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      food: "Alimentos",
      medicine: "Medicamentos",
      accessory: "Acessórios",
      toy: "Brinquedos",
      hygiene: "Higiene",
      other: "Outros",
    };
    return labels[category] || category;
  };

  // Calcular estatísticas de movimentações do mês
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  
  const { data: stockStats } = useQuery({
    queryKey: ["stock-movements", "stats", tenantId, monthStart, monthEnd],
    queryFn: () => {
      if (!tenantId) return { totalEntries: 0, totalExits: 0 };
      return stockMovementsService.getStats(tenantId, monthStart, monthEnd);
    },
    enabled: !!tenantId,
  });

  // Calcular estatísticas
  const totalProducts = products.length;
  const lowStockCount = lowStockProducts.length;
  const monthlyEntries = stockStats?.totalEntries || 0;
  const monthlyExits = stockStats?.totalExits || 0;

  const stats = [
    { label: "Total de Produtos", value: totalProducts.toString(), icon: Package, color: "text-primary" },
    { label: "Estoque Baixo", value: lowStockCount.toString(), icon: AlertTriangle, color: "text-orange-500" },
    { label: "Entrada (Mês)", value: `+${monthlyEntries}`, icon: TrendingUp, color: "text-green-500" },
    { label: "Saída (Mês)", value: `-${monthlyExits}`, icon: TrendingDown, color: "text-red-500" },
  ];

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleSaveProduct = async (data: any) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

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
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-muted-foreground">Controle completo de produtos e movimentações</p>
          </div>
          {canCreate && (
            <Button className="gap-2" onClick={handleNewProduct}>
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando produtos...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            ) : (
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
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{getCategoryLabel(product.category)}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell className="text-center">{product.min_stock}</TableCell>
                      <TableCell className="text-right">R$ {Number(product.sale_price).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{getStockBadge(product)}</TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                            Editar
                          </Button>
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

      <ProductDialog
        open={productDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          setEditDialogOpen(open);
          if (!open) setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </DashboardLayout>
  );
};

export default Inventory;
