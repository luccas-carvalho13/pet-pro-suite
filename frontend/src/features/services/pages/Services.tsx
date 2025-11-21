import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Plus, Search, Scissors, Stethoscope, Bath, Syringe } from "lucide-react";
import { useState } from "react";
import { ServiceDialog } from "@/shared/components/dialogs";
import { servicesService, type Service } from "@/api/services/services.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Services = () => {
  const { tenantId, userId, user } = useAuth();
  const { can } = usePermissions(tenantId || undefined, user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  
  const canCreate = can("services", "create");
  const canEdit = can("services", "edit");
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const queryClient = useQueryClient();

  // Buscar serviços
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return servicesService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Criar serviço
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof servicesService.create>[2]) => {
      if (!tenantId || !userId) throw new Error("Tenant ID ou User ID não encontrado");
      return servicesService.create(tenantId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
      setServiceDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar serviço");
    },
  });

  // Atualizar serviço
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof servicesService.update>[2] }) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return servicesService.update(id, tenantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar serviço");
    },
  });

  // Filtrar serviços
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "veterinary":
        return <Stethoscope className="h-4 w-4" />;
      case "grooming":
        return <Scissors className="h-4 w-4" />;
      default:
        return <Bath className="h-4 w-4" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const labels: Record<string, string> = {
      veterinary: "Veterinário",
      grooming: "Estética",
      hotel: "Hotel",
      retail: "Retail",
      other: "Outros",
    };
    const colors: Record<string, string> = {
      veterinary: "bg-primary",
      grooming: "bg-secondary",
      hotel: "bg-blue-500",
      retail: "bg-green-500",
      other: "bg-gray-500",
    };
    return <Badge className={colors[category] || "bg-gray-500"}>{labels[category] || category}</Badge>;
  };

  // Calcular estatísticas
  const totalServices = services.length;
  const veterinaryServices = services.filter(s => s.category === "veterinary").length;
  const groomingServices = services.filter(s => s.category === "grooming").length;
  const otherServices = services.filter(s => !["veterinary", "grooming"].includes(s.category)).length;

  const stats = [
    { label: "Total de Serviços", value: totalServices.toString(), icon: Stethoscope, color: "text-primary" },
    { label: "Serviços Veterinários", value: veterinaryServices.toString(), icon: Syringe, color: "text-primary" },
    { label: "Serviços Estética", value: groomingServices.toString(), icon: Scissors, color: "text-secondary" },
    { label: "Outros Serviços", value: otherServices.toString(), icon: Bath, color: "text-muted-foreground" },
  ];

  const handleNewService = () => {
    setSelectedService(null);
    setServiceDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  const handleSaveService = async (data: any) => {
    if (selectedService) {
      updateMutation.mutate({ id: selectedService.id, data });
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
            <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
            <p className="text-muted-foreground">Cadastro e controle de serviços oferecidos</p>
          </div>
          {canCreate && (
            <Button className="gap-2" onClick={handleNewService}>
              <Plus className="h-4 w-4" />
              Novo Serviço
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando serviços...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhum serviço encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Duração</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-center">Comissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(service.category)}
                          {service.name}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(service.category)}</TableCell>
                      <TableCell className="text-center">{service.duration} min</TableCell>
                      <TableCell className="text-right">R$ {Number(service.price).toFixed(2)}</TableCell>
                      <TableCell className="text-center">{service.commission || 0}%</TableCell>
                      <TableCell className="text-right">
                        {canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
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

      <ServiceDialog
        open={serviceDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          setServiceDialogOpen(open);
          setEditDialogOpen(open);
          if (!open) setSelectedService(null);
        }}
        service={selectedService}
        onSave={handleSaveService}
      />
    </DashboardLayout>
  );
};

export default Services;
