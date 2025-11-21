import { useState, useRef, useEffect } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { clientsService, type Client } from "@/api/services/clients.service";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface ClientSearchComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  tenantId: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
}

export const ClientSearchCombobox = ({
  value,
  onValueChange,
  tenantId,
  placeholder = "Digite o nome ou CPF do tutor...",
  disabled = false,
  className,
  label,
  required = false,
}: ClientSearchComboboxProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  // Buscar clientes quando há uma query de busca
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["clients", "search", tenantId, debouncedSearch],
    queryFn: () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      return clientsService.search(tenantId, debouncedSearch);
    },
    enabled: !!tenantId && debouncedSearch.length >= 2,
  });

  // Buscar cliente selecionado para exibir o nome
  const { data: selectedClient } = useQuery({
    queryKey: ["client", value],
    queryFn: () => {
      if (!value || !tenantId) return null;
      return clientsService.getById(value, tenantId);
    },
    enabled: !!value && !!tenantId,
  });

  // Limitar a 5 resultados
  const displayResults = searchResults.slice(0, 5);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (client: Client) => {
    onValueChange(client.id);
    setSearchQuery(selectedClient?.name || "");
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setIsOpen(newValue.length >= 2);
    
    // Se limpar o input, limpar também a seleção
    if (newValue.length === 0 && value) {
      onValueChange("");
    }
  };

  const handleInputFocus = () => {
    if (searchQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  // Mostrar nome do cliente selecionado quando não está buscando
  useEffect(() => {
    if (selectedClient && searchQuery.length === 0) {
      setSearchQuery(selectedClient.name);
    }
  }, [selectedClient]);

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <Label htmlFor="client-search">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id="client-search"
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          required={required && !value}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Dropdown com resultados */}
        {isOpen && displayResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
            <div className="max-h-[200px] overflow-y-auto p-1">
              {displayResults.map((client: Client) => (
                <div
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === client.id && "bg-accent"
                  )}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium">{client.name}</span>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {client.cpf && <span>CPF: {client.cpf}</span>}
                      {client.phone && <span>Tel: {client.phone}</span>}
                    </div>
                  </div>
                  {value === client.id && (
                    <Check className="ml-2 h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {isOpen && !isLoading && debouncedSearch.length >= 2 && displayResults.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-4 text-center text-sm text-muted-foreground shadow-md">
            Nenhum tutor encontrado
          </div>
        )}
      </div>

      {/* Mostrar tutor selecionado quando não está buscando */}
      {value && selectedClient && searchQuery === selectedClient.name && (
        <div className="rounded-md border bg-muted/50 p-2 text-sm">
          <span className="text-muted-foreground">Tutor selecionado: </span>
          <span className="font-medium">{selectedClient.name}</span>
          {selectedClient.cpf && (
            <span className="text-muted-foreground"> - CPF: {selectedClient.cpf}</span>
          )}
        </div>
      )}
    </div>
  );
};
