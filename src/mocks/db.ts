import { createSeedDb, type MockDb } from "./seed";

/*
 * "Banco de dados" do modo mock. Vive em memória e é espelhado no
 * localStorage do navegador, então registros e usuários criados durante a
 * demonstração sobrevivem a um recarregamento da página.
 *
 * Para voltar ao estado inicial: `resetMockDb()` no console do navegador
 * (disponível como `window.resetMockDb()` no modo mock) ou limpe o
 * localStorage do site.
 */
const STORAGE_KEY = "sophia:mock:db:v1";

let cache: MockDb | null = null;

function readStorage(): MockDb | null {
    try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as MockDb) : null;
    } catch {
        return null;
    }
}

function writeStorage(db: MockDb) {
    try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
        // Sem localStorage (ou cheio): o mock segue funcionando só em memória.
    }
}

export function getDb(): MockDb {
    if (!cache) {
        cache = readStorage() ?? createSeedDb();
        // Migrate mock data saved before the report endpoint existed.
        if (!Array.isArray(cache.reports)) cache.reports = [];
        writeStorage(cache);
    }
    return cache;
}

/** Chame depois de qualquer alteração em `getDb()` para persistir. */
export function saveDb() {
    if (cache) writeStorage(cache);
}

export function resetMockDb() {
    cache = createSeedDb();
    writeStorage(cache);
}