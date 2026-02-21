import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Phone, Mail, Dog, Pencil, Trash2 } from "lucide-react";
import { createClient, deleteClient, getClients, updateClient, type Client } from "@/lib/api";
import { toast } from "sonner";

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const queryClient = useQueryClient();
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });
  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente criado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar cliente.";
      toast.error(msg);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { name: string; email?: string; phone?: string; address?: string } }) =>
      updateClient(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar cliente.";
      toast.error(msg);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removido.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao remover cliente.";
      toast.error(msg);
    },
  });

  const filteredClients = clients.filter(
    (c: Client) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone ?? "").includes(searchQuery)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e tutores</p>
          </div>
          <Button
            className="gradient-primary shadow-primary w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setForm({ name: "", email: "", phone: "", address: "" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "–" : clients.length}</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "–" : clients.filter((c: Client) => c.status === "active").length}</div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pets Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "–" : clients.reduce((acc: number, c: Client) => acc + (c.pets ?? 0), 0)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive text-sm">Erro ao carregar clientes.</p>}
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead>Pets</TableHead>
                    <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: Client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dog className="h-4 w-4 text-primary" />
                          <span>{client.pets ?? 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("pt-BR") : "–"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status === "active" ? "Ativo" : "Inativo"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => {
                              setEditing(client);
                              setForm({
                                name: client.name,
                                email: client.email ?? "",
                                phone: client.phone ?? "",
                                address: client.address ?? "",
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
                              if (window.confirm("Remover este cliente?")) {
                                deleteMutation.mutate(client.id);
                              }
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
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>Preencha os dados do cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.name.trim()) {
                  toast.error("Nome é obrigatório.");
                  return;
                }
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

export default Clients;
