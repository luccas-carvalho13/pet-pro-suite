import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Scissors, Stethoscope, Bath, Syringe } from "lucide-react";
import { useState } from "react";

const Services = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const services = [
    { id: 1, name: "Consulta Veterinária", category: "Veterinário", duration: "30 min", price: 150.00, commission: 40 },
    { id: 2, name: "Banho e Tosa Pequeno Porte", category: "Estética", duration: "60 min", price: 80.00, commission: 50 },
    { id: 3, name: "Banho e Tosa Grande Porte", category: "Estética", duration: "90 min", price: 120.00, commission: 50 },
    { id: 4, name: "Vacinação V10", category: "Veterinário", duration: "15 min", price: 90.00, commission: 30 },
    { id: 5, name: "Tosa Higiênica", category: "Estética", duration: "30 min", price: 50.00, commission: 50 },
    { id: 6, name: "Cirurgia Castração", category: "Veterinário", duration: "120 min", price: 600.00, commission: 35 },
  ];

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
    { label: "Total de Serviços", value: "24", icon: Stethoscope, color: "text-primary" },
    { label: "Serviços Veterinários", value: "12", icon: Syringe, color: "text-primary" },
    { label: "Serviços Estética", value: "8", icon: Scissors, color: "text-secondary" },
    { label: "Outros Serviços", value: "4", icon: Bath, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
            <p className="text-muted-foreground">Cadastro e controle de serviços oferecidos</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Serviço
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
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(service.category)}
                        {service.name}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(service.category)}</TableCell>
                    <TableCell className="text-center">{service.duration}</TableCell>
                    <TableCell className="text-right">R$ {service.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{service.commission}%</TableCell>
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

export default Services;
