import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Dog, Cat, Heart } from "lucide-react";
import { useState } from "react";

const Pets = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const pets = [
    { 
      id: 1, 
      name: "Max", 
      species: "Cão", 
      breed: "Golden Retriever", 
      age: "3 anos", 
      owner: "João Silva",
      lastVisit: "2024-01-15",
      status: "healthy"
    },
    { 
      id: 2, 
      name: "Luna", 
      species: "Gato", 
      breed: "Persa", 
      age: "2 anos", 
      owner: "Maria Santos",
      lastVisit: "2024-01-14",
      status: "treatment"
    },
    { 
      id: 3, 
      name: "Thor", 
      species: "Cão", 
      breed: "Pastor Alemão", 
      age: "5 anos", 
      owner: "Carlos Lima",
      lastVisit: "2024-01-16",
      status: "healthy"
    },
    { 
      id: 4, 
      name: "Mimi", 
      species: "Gato", 
      breed: "Siamês", 
      age: "1 ano", 
      owner: "Ana Costa",
      lastVisit: "2024-01-10",
      status: "checkup"
    },
  ];

  const stats = [
    { label: "Total de Pets", value: "234", icon: Heart, color: "text-primary" },
    { label: "Cães", value: "156", icon: Dog, color: "text-primary" },
    { label: "Gatos", value: "78", icon: Cat, color: "text-secondary" },
    { label: "Em Tratamento", value: "12", icon: Heart, color: "text-orange-500" },
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

  const getSpeciesIcon = (species: string) => {
    return species === "Cão" ? <Dog className="h-4 w-4" /> : <Cat className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Pets</h1>
            <p className="text-muted-foreground">Cadastro e histórico médico dos pets</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Pet
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
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
                          <p><span className="font-medium">Raça:</span> {pet.breed}</p>
                          <p><span className="font-medium">Idade:</span> {pet.age}</p>
                          <p><span className="font-medium">Tutor:</span> {pet.owner}</p>
                          <p><span className="font-medium">Última visita:</span> {new Date(pet.lastVisit).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Ver Prontuário
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pets;
