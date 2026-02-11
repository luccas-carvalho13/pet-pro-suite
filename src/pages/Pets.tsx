import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Dog, Cat, Heart } from "lucide-react";
import { createPet, deletePet, getClients, getPets, updatePet, type Client, type Pet } from "@/lib/api";
import { toast } from "sonner";

const Pets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [form, setForm] = useState({
    client_id: "",
    name: "",
    species: "Cão",
    breed: "",
    birth_date: "",
  });
  const queryClient = useQueryClient();
  const { data: pets = [], isLoading, error } = useQuery({
    queryKey: ["pets"],
    queryFn: getPets,
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  });
  const createMutation = useMutation({
    mutationFn: createPet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet criado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar pet.";
      toast.error(msg);
    },
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { client_id: string; name: string; species: string; breed?: string; birth_date?: string } }) =>
      updatePet(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet atualizado com sucesso!");
      setDialogOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar pet.";
      toast.error(msg);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deletePet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet removido.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao remover pet.";
      toast.error(msg);
    },
  });

  const filtered = pets.filter(
    (p: Pet) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.breed ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Total de Pets", value: String(pets.length), icon: Heart, color: "text-primary" },
    { label: "Cães", value: String(pets.filter((p: Pet) => p.species === "Cão").length), icon: Dog, color: "text-primary" },
    { label: "Gatos", value: String(pets.filter((p: Pet) => p.species === "Gato").length), icon: Cat, color: "text-secondary" },
    { label: "Em Tratamento", value: String(pets.filter((p: Pet) => p.status === "treatment").length), icon: Heart, color: "text-orange-500" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Saudável</Badge>;
      case "treatment":
        return <Badge className="bg-orange-500">Em Tratamento</Badge>;
      case "checkup":
        return <Badge variant="secondary">Check-up</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSpeciesIcon = (species: string) =>
    species === "Cão" ? <Dog className="h-4 w-4" /> : <Cat className="h-4 w-4" />;

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 10);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Pets</h1>
            <p className="text-muted-foreground">Cadastro e histórico médico dos pets</p>
          </div>
          <Button
            className="gap-2 w-full sm:w-auto"
            onClick={() => {
              setEditing(null);
              setForm({ client_id: clients[0]?.id ?? "", name: "", species: "Cão", breed: "", birth_date: "" });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Cadastrar Pet
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
            <CardTitle>Pets Cadastrados</CardTitle>
            <CardDescription>Lista completa de pets com seus tutores</CardDescription>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar pets..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive text-sm">Erro ao carregar pets.</p>}
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Carregando...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((pet: Pet) => (
                  <Card key={pet.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {pet.species === "Cão" ? "🐕" : "🐱"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {getSpeciesIcon(pet.species)}
                              {pet.name}
                            </h3>
                            {getStatusBadge(pet.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><span className="font-medium">Raça:</span> {pet.breed || "–"}</p>
                            <p><span className="font-medium">Idade:</span> {pet.age || "–"}</p>
                            <p><span className="font-medium">Tutor:</span> {pet.owner}</p>
                            <p><span className="font-medium">Última visita:</span> {pet.lastVisit ? new Date(pet.lastVisit).toLocaleDateString("pt-BR") : "–"}</p>
                          </div>
                          <div className="grid gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                              setEditing(pet);
                              setForm({
                                  client_id: pet.client_id ?? clients[0]?.id ?? "",
                                  name: pet.name,
                                  species: pet.species,
                                  breed: pet.breed ?? "",
                                  birth_date: toDateInput(pet.birth_date),
                              });
                                setDialogOpen(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                if (window.confirm("Remover este pet?")) deleteMutation.mutate(pet.id);
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar pet" : "Cadastrar pet"}</DialogTitle>
            <DialogDescription>Informe os dados do pet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Tutor</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tutor" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c: Client) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome do pet</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do pet"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Espécie</Label>
              <Select
                value={form.species}
                onValueChange={(v) => setForm((f) => ({ ...f, species: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Espécie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cão">Cão</SelectItem>
                  <SelectItem value="Gato">Gato</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Raça</Label>
              <Input
                value={form.breed}
                onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                placeholder="Raça"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.client_id) return toast.error("Selecione o tutor.");
                if (!form.name.trim()) return toast.error("Nome é obrigatório.");
                if (!form.species.trim()) return toast.error("Espécie é obrigatória.");
                const payload = { ...form, birth_date: form.birth_date || undefined };
                if (editing) {
                  updateMutation.mutate({ id: editing.id, data: payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Pets;
