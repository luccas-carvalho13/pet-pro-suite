import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ClientSearchCombobox } from "@/shared/components/ClientSearchCombobox";
import { useAuth } from "@/shared/hooks/useAuth";
import { toast } from "sonner";

interface PetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet?: any;
  onSave?: (data: any) => Promise<void>;
}

export const PetDialog = ({ open, onOpenChange, pet, onSave }: PetDialogProps) => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: pet?.name || "",
    species: pet?.species || "dog",
    breed: pet?.breed || "",
    gender: pet?.gender || "unknown",
    birth_date: pet?.birth_date || "",
    weight: pet?.weight || "",
    color: pet?.color || "",
    client_id: pet?.client_id || "",
  });

  // Atualizar formData quando pet mudar
  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        species: pet.species || "dog",
        breed: pet.breed || "",
        gender: pet.gender || "unknown",
        birth_date: pet.birth_date || "",
        weight: pet.weight || "",
        color: pet.color || "",
        client_id: pet.client_id || "",
      });
    } else {
      setFormData({
        name: "",
        species: "dog",
        breed: "",
        gender: "unknown",
        birth_date: "",
        weight: "",
        color: "",
        client_id: "",
      });
    }
  }, [pet, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      toast.error("Por favor, selecione um tutor");
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight.toString()) : undefined,
        birth_date: formData.birth_date || undefined,
        species: formData.species as "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other",
        gender: formData.gender as "male" | "female" | "unknown",
      };
      
      if (onSave) {
        await onSave(dataToSave);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(pet ? "Pet atualizado com sucesso!" : "Pet cadastrado com sucesso!");
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar pet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pet ? "Editar Pet" : "Cadastrar Pet"}</DialogTitle>
          <DialogDescription>
            {pet ? "Atualize as informações do pet" : "Preencha os dados para cadastrar um novo pet"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Pet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do pet"
                required
              />
            </div>
            <div className="space-y-2">
              {tenantId ? (
                <ClientSearchCombobox
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  tenantId={tenantId}
                  label="Tutor"
                  required
                />
              ) : (
                <div className="space-y-2">
                  <Label>
                    Tutor <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder="Carregando..." disabled />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="species">
                Espécie <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.species} onValueChange={(value) => setFormData({ ...formData, species: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Cão</SelectItem>
                  <SelectItem value="cat">Gato</SelectItem>
                  <SelectItem value="bird">Ave</SelectItem>
                  <SelectItem value="rabbit">Coelho</SelectItem>
                  <SelectItem value="reptile">Réptil</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Raça</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="Raça do pet"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Macho</SelectItem>
                  <SelectItem value="female">Fêmea</SelectItem>
                  <SelectItem value="unknown">Desconhecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Cor predominante"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : pet ? "Atualizar" : "Cadastrar Pet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
