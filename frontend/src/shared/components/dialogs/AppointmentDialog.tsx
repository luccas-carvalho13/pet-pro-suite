import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { toast } from "sonner";
import { ClientSearchCombobox } from "@/shared/components/ClientSearchCombobox";
import { petsService } from "@/api/services/pets.service";
import { servicesService } from "@/api/services/services.service";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/hooks/useAuth";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: any;
  onSave?: (data: any) => Promise<void>;
}

export const AppointmentDialog = ({ open, onOpenChange, appointment, onSave }: AppointmentDialogProps) => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: appointment?.date || new Date().toISOString().split('T')[0],
    start_time: appointment?.start_time || "09:00",
    end_time: appointment?.end_time || "09:30",
    client_id: appointment?.client_id || "",
    pet_id: appointment?.pet_id || "",
    service_id: appointment?.service_id || "",
    veterinarian_id: appointment?.veterinarian_id || "",
    notes: appointment?.notes || "",
  });

  // Atualizar formData quando appointment mudar
  useEffect(() => {
    if (appointment) {
      setFormData({
        date: appointment.date || new Date().toISOString().split('T')[0],
        start_time: appointment.start_time || "09:00",
        end_time: appointment.end_time || "09:30",
        client_id: appointment.client_id || "",
        pet_id: appointment.pet_id || "",
        service_id: appointment.service_id || "",
        veterinarian_id: appointment.veterinarian_id || "",
        notes: appointment.notes || "",
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        start_time: "09:00",
        end_time: "09:30",
        client_id: "",
        pet_id: "",
        service_id: "",
        veterinarian_id: "",
        notes: "",
      });
    }
  }, [appointment]);

  // Buscar pets do cliente selecionado
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", "client", formData.client_id, tenantId],
    queryFn: () => {
      if (!formData.client_id || !tenantId) return [];
      return petsService.getByClient(formData.client_id, tenantId);
    },
    enabled: !!formData.client_id && !!tenantId,
  });

  // Buscar serviços
  const { data: services = [] } = useQuery({
    queryKey: ["services", tenantId],
    queryFn: () => {
      if (!tenantId) return [];
      return servicesService.getAll(tenantId);
    },
    enabled: !!tenantId,
  });

  // Buscar veterinários (usuários com role veterinário)
  // Por enquanto, vamos usar um array vazio já que não temos tabela de veterinários separada
  const veterinarians: any[] = [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        date: formData.date,
      };
      
      if (onSave) {
        await onSave(dataToSave);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(appointment ? "Agendamento atualizado com sucesso!" : "Agendamento criado com sucesso!");
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar agendamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointment ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
          <DialogDescription>
            {appointment ? "Atualize as informações do agendamento" : "Preencha os dados para criar um novo agendamento"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="start_time">Início *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fim *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {tenantId && (
                <ClientSearchCombobox
                  value={formData.client_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, client_id: value, pet_id: "" });
                  }}
                  tenantId={tenantId}
                  label="Cliente"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet">Pet *</Label>
              <Select 
                value={formData.pet_id} 
                onValueChange={(value) => setFormData({ ...formData, pet_id: value })}
                disabled={!formData.client_id || pets.length === 0}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.client_id ? "Selecione o cliente primeiro" : "Selecione o pet"} />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species === "dog" ? "Cão" : pet.species === "cat" ? "Gato" : pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service">Serviço *</Label>
              <Select 
                value={formData.service_id} 
                onValueChange={(value) => {
                  const selectedService = services.find(s => s.id === value);
                  if (selectedService) {
                    const startTime = new Date(`2000-01-01T${formData.start_time}`);
                    const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);
                    setFormData({ 
                      ...formData, 
                      service_id: value,
                      end_time: endTime.toTimeString().slice(0, 5)
                    });
                  } else {
                    setFormData({ ...formData, service_id: value });
                  }
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinário</Label>
              <Select 
                value={formData.veterinarian_id || ""} 
                onValueChange={(value) => setFormData({ ...formData, veterinarian_id: value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {veterinarians.length === 0 && (
                    <SelectItem value="" disabled>Nenhum veterinário disponível</SelectItem>
                  )}
                  {veterinarians.map((vet) => (
                    <SelectItem key={vet.id} value={vet.id}>
                      {vet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Adicione observações sobre o agendamento..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : appointment ? "Atualizar" : "Criar Agendamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

