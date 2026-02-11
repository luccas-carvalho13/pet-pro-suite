import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import {
  createMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecords,
  getPets,
  updateMedicalRecord,
  type MedicalRecord,
  type MedicalRecordPayload,
  type Pet,
} from "@/lib/api";

const toDateInput = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const MedicalRecords = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [form, setForm] = useState<MedicalRecordPayload>({
    pet_id: "",
    appointment_id: "",
    record_date: new Date().toISOString().slice(0, 10),
    weight_kg: undefined,
    temperature_c: undefined,
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["medical-records", searchQuery],
    queryFn: () => getMedicalRecords({ q: searchQuery, limit: 100 }),
  });

  const { data: pets = [] } = useQuery({ queryKey: ["pets"], queryFn: getPets });

  const createMutation = useMutation({
    mutationFn: createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      toast.success("Prontuário criado.");
      setDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao criar prontuário."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: MedicalRecordPayload }) => updateMedicalRecord(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      toast.success("Prontuário atualizado.");
      setDialogOpen(false);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao atualizar prontuário."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      toast.success("Prontuário removido.");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao remover prontuário."),
  });

  const selectedPet = useMemo(
    () => pets.find((pet: Pet) => pet.id === form.pet_id),
    [pets, form.pet_id]
  );

  const resetForm = () => {
    setEditing(null);
    setForm({
      pet_id: "",
      appointment_id: "",
      record_date: new Date().toISOString().slice(0, 10),
      weight_kg: undefined,
      temperature_c: undefined,
      diagnosis: "",
      treatment: "",
      notes: "",
    });
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (record: MedicalRecord) => {
    setEditing(record);
    setForm({
      pet_id: record.pet_id,
      appointment_id: record.appointment_id ?? "",
      record_date: toDateInput(record.record_date),
      weight_kg: record.weight_kg ?? undefined,
      temperature_c: record.temperature_c ?? undefined,
      diagnosis: record.diagnosis ?? "",
      treatment: record.treatment ?? "",
      notes: record.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.pet_id) return toast.error("Selecione o pet.");
    if (!form.record_date) return toast.error("Informe a data do registro.");

    const payload: MedicalRecordPayload = {
      pet_id: form.pet_id,
      appointment_id: form.appointment_id?.trim() || undefined,
      record_date: form.record_date,
      weight_kg: form.weight_kg,
      temperature_c: form.temperature_c,
      diagnosis: form.diagnosis?.trim() || undefined,
      treatment: form.treatment?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Prontuário Clínico</h1>
            <p className="text-muted-foreground">Registro médico completo por pet</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Registros Clínicos
            </CardTitle>
            <CardDescription>Histórico de atendimentos, diagnósticos e tratamentos</CardDescription>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por pet, tutor ou diagnóstico"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-destructive mb-4">Erro ao carregar prontuários.</p>}
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead className="hidden md:table-cell">Tutor</TableHead>
                    <TableHead className="hidden lg:table-cell">Diagnóstico</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.record_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium">{record.pet_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{record.client_name}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[320px] truncate">{record.diagnosis || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(record)}>
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm("Remover este prontuário?")) deleteMutation.mutate(record.id);
                            }}
                          >
                            Excluir
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar prontuário" : "Novo prontuário"}</DialogTitle>
            <DialogDescription>Preencha os dados clínicos do atendimento.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Pet</Label>
              <Select value={form.pet_id} onValueChange={(v) => setForm((s) => ({ ...s, pet_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets.map((pet: Pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} {pet.owner ? `• ${pet.owner}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPet ? <p className="text-xs text-muted-foreground">Tutor: {selectedPet.owner}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Data do registro</Label>
              <Input
                type="date"
                value={form.record_date}
                onChange={(e) => setForm((s) => ({ ...s, record_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.weight_kg ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, weight_kg: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Temperatura (°C)</Label>
              <Input
                type="number"
                min="30"
                max="45"
                step="0.1"
                value={form.temperature_c ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, temperature_c: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Diagnóstico</Label>
              <Textarea
                rows={3}
                value={form.diagnosis ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, diagnosis: e.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Tratamento</Label>
              <Textarea
                rows={3}
                value={form.treatment ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, treatment: e.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MedicalRecords;
