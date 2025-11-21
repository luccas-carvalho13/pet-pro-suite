import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";

interface ViewDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: Record<string, any>;
  onEdit?: () => void;
}

export const ViewDetailsDialog = ({ open, onOpenChange, title, data, onEdit }: ViewDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Detalhes completos</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-sm font-semibold">
                  {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
                </span>
              </div>
              <Separator className="mt-2" />
            </div>
          ))}
          {onEdit && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={onEdit}>
                Editar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

