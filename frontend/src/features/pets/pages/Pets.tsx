import { useState } from "react";
import { DashboardLayout } from "@/shared/components/DashboardLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Plus, Search, Dog, Cat, Heart } from "lucide-react";
import { PetDialog, ViewDetailsDialog } from "@/shared/components/dialogs";
import { petsService, type Pet } from "@/api/services/pets.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { usePermissions } from "@/shared/hooks/usePermissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const Pets = () => {
  const { tenantId, userId, user } = useAuth();
  const { can } = usePermissions(tenantId || undefined, user?.role);
  const [searchQuery, setSearchQuery] = useState("");
  
  const canCreate = can("pets", "create");
  const canEdit = can("pets", "edit");
  const [petDialogOpen, setPetDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const queryClient = useQueryClient();

  // Buscar pets
  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["pets", tenantId],
    queryFn: () => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return petsService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Criar pet
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof petsService.create>[2]) => {
      if (!tenantId || !userId) throw new Error("Tenant ID ou User ID não encontrado");
      return petsService.create(tenantId, userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet cadastrado com sucesso!");
      setPetDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cadastrar pet");
    },
  });

  // Atualizar pet
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof petsService.update>[2] }) => {
      if (!tenantId) throw new Error("Tenant ID não encontrado");
      return petsService.update(id, tenantId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet atualizado com sucesso!");
      setPetDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar pet");
    },
  });

  // Filtrar pets
  const filteredPets = pets.filter((pet) =>
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calcular estatísticas
  const totalPets = pets.length;
  const dogs = pets.filter(p => p.species === "dog").length;
  const cats = pets.filter(p => p.species === "cat").length;
  const inTreatment = pets.length; // TODO: Implementar lógica real baseada em histórico médico

  const getStatusBadge = (pet: Pet) => {
    // Verificar se tem histórico médico recente ou medicações ativas
    const hasRecentHistory = pet.medical_history && Array.isArray(pet.medical_history) && pet.medical_history.length > 0;
    const hasActiveMedications = pet.medications && Array.isArray(pet.medications) && pet.medications.length > 0;
    const hasAllergies = pet.allergies && Array.isArray(pet.allergies) && pet.allergies.length > 0;
    
    if (hasActiveMedications) {
      return <Badge className="bg-yellow-500">Em Tratamento</Badge>;
    }
    if (hasAllergies) {
      return <Badge className="bg-orange-500">Alergias</Badge>;
    }
    if (hasRecentHistory) {
      return <Badge className="bg-blue-500">Histórico Médico</Badge>;
    }
    return <Badge className="bg-green-500">Saudável</Badge>;
  };

  const getSpeciesIcon = (species: string) => {
    return species === "dog" ? <Dog className="h-4 w-4" /> : <Cat className="h-4 w-4" />;
  };

  const getSpeciesLabel = (species: string) => {
    const labels: Record<string, string> = {
      dog: "Cão",
      cat: "Gato",
      bird: "Ave",
      rabbit: "Coelho",
      reptile: "Réptil",
      other: "Outro",
    };
    return labels[species] || species;
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "Idade não informada";
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (years > 0) {
      return `${years} ${years === 1 ? "ano" : "anos"}`;
    }
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  };

  const handleNewPet = () => {
    setSelectedPet(null);
    setPetDialogOpen(true);
  };

  const handleViewDetails = (pet: Pet) => {
    setSelectedPet(pet);
    setDetailsDialogOpen(true);
  };

  const handleSavePet = async (data: any) => {
    if (selectedPet) {
      updateMutation.mutate({ id: selectedPet.id, data });
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
            <h1 className="text-3xl font-bold">Gestão de Pets</h1>
            <p className="text-muted-foreground">Cadastro e histórico médico dos pets</p>
          </div>
          {canCreate && (
            <Button className="gap-2" onClick={handleNewPet}>
              <Plus className="h-4 w-4" />
              Cadastrar Pet
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Pets</p>
                  <p className="text-2xl font-bold mt-1">{totalPets}</p>
                </div>
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cães</p>
                  <p className="text-2xl font-bold mt-1">{dogs}</p>
                </div>
                <Dog className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gatos</p>
                  <p className="text-2xl font-bold mt-1">{cats}</p>
                </div>
                <Cat className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Tratamento</p>
                  <p className="text-2xl font-bold mt-1">{inTreatment}</p>
                </div>
                <Heart className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando pets...</p>
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhum pet encontrado</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPets.map((pet) => {
                  const client = (pet as any).clients;
                  return (
                    <Card key={pet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {pet.species === "dog" ? "🐕" : pet.species === "cat" ? "🐱" : "🐾"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                {getSpeciesIcon(pet.species)}
                                {pet.name}
                              </h3>
                              {getStatusBadge(pet)}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {pet.breed && <p><span className="font-medium">Raça:</span> {pet.breed}</p>}
                              {pet.birth_date && <p><span className="font-medium">Idade:</span> {calculateAge(pet.birth_date)}</p>}
                              {client && <p><span className="font-medium">Tutor:</span> {client.name}</p>}
                              {pet.created_at && <p><span className="font-medium">Cadastrado em:</span> {new Date(pet.created_at).toLocaleDateString('pt-BR')}</p>}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => handleViewDetails(pet)}
                            >
                              Ver Prontuário
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PetDialog
        open={petDialogOpen}
        onOpenChange={(open) => {
          setPetDialogOpen(open);
          if (!open) setSelectedPet(null);
        }}
        pet={selectedPet}
        onSave={handleSavePet}
      />

      <ViewDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        title="Prontuário do Pet"
        data={selectedPet || {}}
      />
    </DashboardLayout>
  );
};

export default Pets;
