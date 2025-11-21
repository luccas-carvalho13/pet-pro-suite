import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { toast } from "sonner";
import { permissionsService, type RolePermission } from "@/api/services/permissions.service";

interface PermissionsProps {
  tenantId: string;
}

const MODULES = [
  { id: "clients", name: "Clientes" },
  { id: "pets", name: "Pets" },
  { id: "appointments", name: "Agendamentos" },
  { id: "services", name: "Serviços" },
  { id: "inventory", name: "Estoque" },
  { id: "financial", name: "Financeiro" },
  { id: "reports", name: "Relatórios" },
  { id: "settings", name: "Configurações" },
];

const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "attendant", label: "Atendente" },
  { value: "user", label: "Usuário" },
];

export const Permissions = ({ tenantId }: PermissionsProps) => {
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [permissions, setPermissions] = useState<Record<string, RolePermission>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, [selectedRole, tenantId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const perms = await permissionsService.getByTenantAndRole(tenantId, selectedRole);
      const permsMap: Record<string, RolePermission> = {};
      
      MODULES.forEach(module => {
        const perm = perms.find(p => p.module === module.id);
        if (perm) {
          permsMap[module.id] = perm;
        } else {
          // Criar permissão padrão se não existir
          permsMap[module.id] = {
            id: "",
            tenant_id: tenantId,
            role: selectedRole as any,
            module: module.id,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
          } as RolePermission;
        }
      });

      setPermissions(permsMap);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar permissões");
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (module: string, field: keyof RolePermission, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissionsArray = Object.values(permissions).map(perm => ({
        module: perm.module,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete,
      }));

      await permissionsService.bulkUpdate(tenantId, selectedRole, permissionsArray);
      toast.success("Permissões salvas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar permissões");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões por Papel</CardTitle>
        <CardDescription>
          Configure o que cada papel pode fazer no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Label>Papel:</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center">Ver</TableHead>
                    <TableHead className="text-center">Criar</TableHead>
                    <TableHead className="text-center">Editar</TableHead>
                    <TableHead className="text-center">Excluir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(module => {
                    const perm = permissions[module.id];
                    if (!perm) return null;

                    return (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.can_view}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_view", checked === true)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.can_create}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_create", checked === true)
                            }
                            disabled={!perm.can_view}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.can_edit}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_edit", checked === true)
                            }
                            disabled={!perm.can_view}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={perm.can_delete}
                            onCheckedChange={(checked) =>
                              updatePermission(module.id, "can_delete", checked === true)
                            }
                            disabled={!perm.can_view}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Permissões"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

