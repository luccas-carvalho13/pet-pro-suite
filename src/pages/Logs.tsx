import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getClientLogs } from "@/lib/client-logs";
import { ArrowLeft, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function Logs() {
  const [clientLogs, setClientLogs] = useState(getClientLogs());
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchApiLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/logs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { logs: string[] };
      setApiLogs(data.logs ?? []);
      setApiError(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "API indisponível");
      setApiLogs([]);
    }
  };

  useEffect(() => {
    fetchApiLogs();
    const t = setInterval(fetchApiLogs, 3000);
    return () => clearInterval(t);
  }, []);

  // Atualiza logs do cliente quando a página ganha foco (ex.: voltou de outra tela)
  useEffect(() => {
    const onFocus = () => setClientLogs(getClientLogs());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Logs</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Erros do navegador
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setClientLogs(getClientLogs())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[220px] w-full rounded-md border bg-muted/50 p-3 font-mono text-sm">
              {clientLogs.length === 0 ? (
                <p className="text-muted-foreground">Nenhum erro registrado ainda.</p>
              ) : (
                clientLogs.map((l, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-muted-foreground">[{l.ts}]</span>{" "}
                    {l.message}
                    {l.detail && (
                      <div className="ml-4 text-destructive break-all">{l.detail}</div>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Logs da API
              <Button variant="ghost" size="sm" onClick={fetchApiLogs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiError && (
              <p className="text-destructive font-medium mb-2">{apiError}</p>
            )}
            <ScrollArea className="h-[320px] w-full rounded-md border bg-muted/50 p-3 font-mono text-sm whitespace-pre-wrap break-all">
              {apiLogs.length === 0 && !apiError ? (
                <p className="text-muted-foreground">Carregando…</p>
              ) : (
                apiLogs.map((line, i) => (
                  <div key={i} className="mb-0.5">
                    {line}
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
