import { useState, useEffect } from "react";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Search, Plus, Phone, Mail, Dog } from "lucide-react";
import { ClientDialog, ViewDetailsDialog } from "@/shared/components/dialogs";
import { clientsService, type Client } from "@/api/services/clients.service";
import { petsService } from "@/api/services/pets.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Clients = () => {
  const { tenantId, userId, user } = useAuth();
  const { can } = usePermissions(tenantId || undefined, user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();
  
  const canCreate = can("clients", "create");
  const canEdit = can("clients", "edit");
  const canDelete = can("clients", "delete");

  // Buscar clientes
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return clientsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar pets por cliente para estatísticas
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return petsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Criar cliente
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof clientsService.create>[2]) => {
      if (!tenantId || !userId) throw new Error("Tenant ID ou User ID não encontrado");
      return clientsService.create(tenantId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Cliente criado com sucesso!");
      setClientDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });

  // Atualizar cliente
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof clientsService.update>[2] }) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return clientsService.update(id, tenantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente atualizado com sucesso!");
      setClientDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  // Filtrar clientes
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  // Calcular estatísticas
  const totalClients = clients.length;
  const activeClients = clients.length; // Por enquanto todos são ativos
  const totalPets = pets.length;

  // Contar pets por cliente
  const getPetsCount = (clientId: string) => {
    return pets.filter(pet => pet.client_id === clientId).length;
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setClientDialogOpen(true);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setDetailsDialogOpen(true);
  };

  const handleSaveClient = async (data: any) => {
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, data });
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
            <h1 className="text-3xl font-bold mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e tutores</p>
          </div>
          {canCreate && (
            <Button className="gradient-primary shadow-primary" onClick={handleNewClient}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground mt-1">+{totalClients} este mês</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeClients}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0}% do total</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pets Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalPets}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalClients > 0 ? (totalPets / totalClients).toFixed(1) : 0} pets/cliente</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando clientes...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Pets</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dog className="h-4 w-4 text-primary" />
                          <span>{getPetsCount(client.id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.created_at ? new Date(client.created_at).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Ativo</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(client)}
                        >
                          Ver Detalhes
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

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={(open) => {
          setClientDialogOpen(open);
          if (!open) setSelectedClient(null);
        }}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      <ViewDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        title="Detalhes do Cliente"
        data={selectedClient || {}}
      />
    </DashboardLayout>
  );
};

export default Clients;
