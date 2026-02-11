/** Logs do navegador (requisições que falharam, erros de rede, etc.) para exibir em /logs. */
const MAX = 200;
const clientLogs: { ts: string; message: string; detail?: string }[] = [];

export function addClientLog(message: string, detail?: string) {
  clientLogs.push({
    ts: new Date().toISOString(),
    message,
    detail: detail ?? undefined,
  });
  if (clientLogs.length > MAX) clientLogs.shift();
}

export function getClientLogs(): { ts: string; message: string; detail?: string }[] {
  return [...clientLogs];
}
