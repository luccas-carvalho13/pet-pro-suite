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
import { Plus, Search, Stethoscope, Eye, Pencil, Trash2, Paperclip, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  createMedicalRecord,
  deleteAttachment as deleteEntityAttachment,
  deleteMedicalRecord,
  getAttachments,
  getMedicalRecords,
  getPets,
  uploadAttachment,
  updateMedicalRecord,
  type EntityAttachment,
  type MedicalRecord,
  type MedicalRecordPayload,
  type Pet,
} from "@/lib/api";

const toLocalDateISO = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateInput = (value: string) => {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  return toLocalDateISO(d);
};

const formatRecordDate = (value: string) => {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return `${day}/${month}/${year}`;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

const formatBytes = (value: number) => {
  if (!value) return "0 KB";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const MedicalRecords = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [viewing, setViewing] = useState<MedicalRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [form, setForm] = useState<MedicalRecordPayload>({
    pet_id: "",
    appointment_id: "",
    record_date: toLocalDateISO(),
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
  const { data: editingAttachments = [] } = useQuery({
    queryKey: ["attachments", "medical_record", editing?.id],
    queryFn: () => getAttachments("medical_record", editing!.id),
    enabled: dialogOpen && !!editing?.id,
  });
  const { data: viewingAttachments = [] } = useQuery({
    queryKey: ["attachments", "medical_record", viewing?.id],
    queryFn: () => getAttachments("medical_record", viewing!.id),
    enabled: viewDialogOpen && !!viewing?.id,
  });

  const createMutation = useMutation({
    mutationFn: createMedicalRecord,
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao criar prontuário."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: MedicalRecordPayload }) => updateMedicalRecord(payload.id, payload.data),
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

  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteEntityAttachment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast.success("Anexo removido.");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Erro ao remover anexo."),
  });

  const selectedPet = useMemo(
    () => pets.find((pet: Pet) => pet.id === form.pet_id),
    [pets, form.pet_id]
  );

  const resetForm = () => {
    setEditing(null);
    setSelectedFiles([]);
    setForm({
      pet_id: "",
      appointment_id: "",
      record_date: toLocalDateISO(),
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
    setSelectedFiles([]);
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

  const openView = (record: MedicalRecord) => {
    setViewing(record);
    setViewDialogOpen(true);
  };

  const handleSave = async () => {
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

    try {
      const saved = editing
        ? await updateMutation.mutateAsync({ id: editing.id, data: payload })
        : await createMutation.mutateAsync(payload);

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await uploadAttachment("medical_record", saved.id, file);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["medical-records"] });
      await queryClient.invalidateQueries({ queryKey: ["attachments"] });
      toast.success(editing ? "Prontuário atualizado." : "Prontuário criado.");
      setDialogOpen(false);
      resetForm();
    } catch {
      // feedback already shown by mutations
    }
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
                      <TableCell>{formatRecordDate(record.record_date)}</TableCell>
                      <TableCell className="font-medium">{record.pet_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{record.client_name}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[320px] truncate">{record.diagnosis || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" title="Ver" aria-label="Ver" onClick={() => openView(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar" aria-label="Editar" onClick={() => openEdit(record)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            aria-label="Excluir"
                            onClick={() => {
                              if (window.confirm("Remover este prontuário?")) deleteMutation.mutate(record.id);
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
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

            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos
              </Label>
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">Anexe exames, fotos e documentos (até 8MB).</p>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => document.getElementById("medicalRecordFilesInput")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar arquivos
                  </Button>
                  <input
                    id="medicalRecordFilesInput"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length) return;
                      setSelectedFiles((prev) => [...prev, ...files]);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>

                {editing && editingAttachments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Anexos já enviados</p>
                    {editingAttachments.map((attachment: EntityAttachment) => (
                      <div key={attachment.id} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline-offset-4 hover:underline truncate"
                        >
                          {attachment.file_name}
                        </a>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatBytes(attachment.size_bytes)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Arquivos selecionados para envio</p>
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5">
                        <span className="text-sm truncate">{file.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSave()} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar prontuário</DialogTitle>
            <DialogDescription>Dados clínicos registrados.</DialogDescription>
          </DialogHeader>
          {viewing ? (
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium">{formatRecordDate(viewing.record_date)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pet</p>
                <p className="font-medium">{viewing.pet_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tutor</p>
                <p className="font-medium">{viewing.client_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Peso / Temperatura</p>
                <p className="font-medium">
                  {viewing.weight_kg != null ? `${viewing.weight_kg} kg` : "—"} / {viewing.temperature_c != null ? `${viewing.temperature_c} ºC` : "—"}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Diagnóstico</p>
                <p className="font-medium whitespace-pre-wrap">{viewing.diagnosis || "—"}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Tratamento</p>
                <p className="font-medium whitespace-pre-wrap">{viewing.treatment || "—"}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="font-medium whitespace-pre-wrap">{viewing.notes || "—"}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Anexos</p>
                {viewingAttachments.length ? (
                  <div className="space-y-2">
                    {viewingAttachments.map((attachment: EntityAttachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        <span className="truncate">{attachment.file_name}</span>
                        <span className="text-xs text-muted-foreground">{formatBytes(attachment.size_bytes)}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MedicalRecords;
