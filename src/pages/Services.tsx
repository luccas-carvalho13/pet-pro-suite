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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Scissors, Stethoscope, Bath, Syringe, Pencil, Trash2 } from "lucide-react";
import { createService, deleteService, getServices, updateService, type Service } from "@/lib/api";
import { toast } from "sonner";

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "Veterinário",
    duration_minutes: 30,
    price: 0,
    commission_pct: 0,
  });
  const queryClient = useQueryClient();
  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar serviço.";
      toast.error(msg);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { name: string; category: string; duration_minutes: number; price: number; commission_pct?: number } }) =>
      updateService(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar serviço.";
      toast.error(msg);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço removido.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao remover serviço.";
      toast.error(msg);
    },
  });

  const filtered = services.filter(
    (s: Service) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Veterinário":
        return <Stethoscope className="h-4 w-4" />;
      case "Estética":
        return <Scissors className="h-4 w-4" />;
      default:
        return <Bath className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "Veterinário":
        return <Badge className="bg-primary">{category}</Badge>;
      case "Estética":
        return <Badge className="bg-secondary">{category}</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const stats = [
    { label: "Total de Serviços", value: String(services.length), icon: Stethoscope, color: "text-primary" },
    { label: "Veterinários", value: String(services.filter((s: Service) => s.category === "Veterinário").length), icon: Syringe, color: "text-primary" },
    { label: "Estética", value: String(services.filter((s: Service) => s.category === "Estética").length), icon: Scissors, color: "text-secondary" },
    { label: "Outros", value: String(services.filter((s: Service) => s.category !== "Veterinário" && s.category !== "Estética").length), icon: Bath, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
            <p className="text-muted-foreground">Cadastro e controle de serviços oferecidos</p>
          </div>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setForm({ name: "", category: "Veterinário", duration_minutes: 30, price: 0, commission_pct: 0 });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Serviço
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
            <CardTitle>Serviços Cadastrados</CardTitle>
            <CardDescription>Lista completa de serviços disponíveis</CardDescription>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar serviços..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive text-sm">Erro ao carregar serviços.</p>}
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-center hidden md:table-cell">Duração</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Comissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s: Service) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(s.category)}
                          {s.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getCategoryBadge(s.category)}</TableCell>
                      <TableCell className="text-center hidden md:table-cell">{s.duration}</TableCell>
                      <TableCell className="text-right">R$ {Number(s.price).toFixed(2)}</TableCell>
                      <TableCell className="text-center hidden lg:table-cell">{s.commission}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => {
                              setEditing(s);
                              setForm({
                                name: s.name,
                                category: s.category,
                                duration_minutes: Number(s.duration.replace(" min", "")) || 30,
                                price: s.price,
                                commission_pct: s.commission,
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
                              if (window.confirm("Remover este serviço?")) deleteMutation.mutate(s.id);
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
            <DialogTitle>{editing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>Preencha os dados do serviço.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Veterinário">Veterinário</SelectItem>
                  <SelectItem value="Estética">Estética</SelectItem>
                  <SelectItem value="Banho">Banho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.commission_pct}
                  onChange={(e) => setForm((f) => ({ ...f, commission_pct: Number(e.target.value) }))}
                />
              </div>
            </div>
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

export default Services;
