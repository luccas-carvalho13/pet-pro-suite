/**
 * Logger que grava em server/logs.txt (além do console).
 * Assim o arquivo fica visível na pasta do código.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default: server/logs.txt (relativo à pasta do server)
const LOG_FILE = process.env.LOG_FILE ?? path.join(__dirname, '..', 'logs.txt');
/** Caminho absoluto do arquivo de log (para exibir no arranque da API). */
export const logFilePath = path.resolve(LOG_FILE);
/** Buffer em memória (últimas 1000 linhas) para exibir na tela /logs. */
const MAX_BUFFER = 1000;
const logBuffer = [];
function pushToBuffer(text) {
    logBuffer.push(text);
    if (logBuffer.length > MAX_BUFFER)
        logBuffer.shift();
}
/** Retorna as últimas linhas de log para GET /api/logs. */
export function getLogLines() {
    return [...logBuffer];
}
function ensureFileDir(filePath) {
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    catch {
        // ignore
    }
}
function write(level, message, extra) {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level}] ${message}`;
    const extraStr = extra !== undefined
        ? '\n' +
            (typeof extra === 'object' && extra !== null && 'stack' in extra
                ? extra.stack ?? JSON.stringify(extra, null, 2)
                : JSON.stringify(extra, null, 2))
        : '';
    // Console
    if (level === 'ERROR') {
        console.error(line, extraStr || '');
    }
    else {
        console.log(line);
    }
    const fullLine = line + extraStr + '\n';
    pushToBuffer(fullLine.trimEnd());
    try {
        ensureFileDir(LOG_FILE);
        fs.appendFileSync(LOG_FILE, fullLine, 'utf8');
    }
    catch (e) {
        console.error('Falha ao escrever log em arquivo:', e);
    }
}
export const logger = {
    info(message, data) {
        write('INFO', data ? `${message} ${JSON.stringify(data)}` : message);
    },
    error(message, err) {
        const extra = err instanceof Error
            ? { name: err.name, message: err.message, stack: err.stack, ...err }
            : err;
        write('ERROR', message, extra);
    },
    /** Erro completo (stack + objeto) para arquivo de log */
    errorFull(message, err) {
        const ts = new Date().toISOString();
        const head = `[${ts}] [ERROR] ${message}`;
        let body = '';
        if (err !== undefined) {
            if (err instanceof Error) {
                body = `\n${err.name}: ${err.message}\n${err.stack ?? ''}\n`;
                try {
                    body += JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
                }
                catch {
                    body += String(err);
                }
            }
            else {
                body = '\n' + JSON.stringify(err, null, 2);
            }
        }
        const fullLine = head + body + '\n';
        pushToBuffer(fullLine.trimEnd());
        console.error(head, body);
        try {
            ensureFileDir(LOG_FILE);
            fs.appendFileSync(LOG_FILE, fullLine, 'utf8');
        }
        catch (e) {
            console.error('Falha ao escrever log em arquivo:', e);
        }
    },
};
