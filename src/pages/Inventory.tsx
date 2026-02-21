import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, AlertTriangle, TrendingDown, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { createProduct, deleteProduct, getProducts, updateProduct, type Product } from "@/lib/api";
import { toast } from "sonner";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    stock: 0,
    min_stock: 0,
    price: 0,
    unit: "un",
  });
  const queryClient = useQueryClient();
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar produto.";
      toast.error(msg);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { name: string; category: string; stock: number; min_stock: number; price: number; unit?: string } }) =>
      updateProduct(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar produto.";
      toast.error(msg);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto removido.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao remover produto.";
      toast.error(msg);
    },
  });

  const filtered = products.filter(
    (p: Product) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowCount = products.filter((p: Product) => p.status === "low" || p.status === "critical").length;
  const stats = [
    { label: "Total de Produtos", value: String(products.length), icon: Package, color: "text-primary" },
    { label: "Estoque Baixo", value: String(lowCount), icon: AlertTriangle, color: "text-warning" },
    { label: "Entrada (Mês)", value: "–", icon: TrendingUp, color: "text-success" },
    { label: "Saída (Mês)", value: "–", icon: TrendingDown, color: "text-destructive" },
  ];

  const getStockBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "low":
        return <Badge className="bg-warning text-warning-foreground">Baixo</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-muted-foreground">Controle completo de produtos e movimentações</p>
          </div>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setForm({ name: "", category: "", stock: 0, min_stock: 0, price: 0, unit: "un" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <s.icon className={`h-8 w-8 ${s.color}`} />
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
            {error && <p className="text-destructive text-sm">Erro ao carregar produtos.</p>}
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Mínimo</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p: Product) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.category}</TableCell>
                      <TableCell className="text-center">{p.stock}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">{p.minStock}</TableCell>
                      <TableCell className="text-right">R$ {Number(p.price).toFixed(2)}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{getStockBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => {
                              setEditing(p);
                              setForm({
                                name: p.name,
                                category: p.category,
                                stock: p.stock,
                                min_stock: p.minStock,
                                price: p.price,
                                unit: "un",
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
                              if (window.confirm("Remover este produto?")) deleteMutation.mutate(p.id);
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Adicionar produto"}</DialogTitle>
            <DialogDescription>Preencha os dados do produto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Estoque</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mínimo</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_stock}
                  onChange={(e) => setForm((f) => ({ ...f, min_stock: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Preço</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.name.trim()) return toast.error("Nome é obrigatório.");
                if (!form.category.trim()) return toast.error("Categoria é obrigatória.");
                if (form.price < 0) return toast.error("Preço inválido.");
                if (editing) {
                  updateMutation.mutate({ id: editing.id, data: form });
                } else {
                  createMutation.mutate(form);
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

export default Inventory;
