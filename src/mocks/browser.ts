import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { resetMockDb } from "./db";

export const worker = setupWorker(...handlers);

// Atalho para o console do navegador: window.resetMockDb() volta os dados
// (usuários, registros, predições) ao estado inicial.
(window as unknown as { resetMockDb: () => void }).resetMockDb = () => {
    resetMockDb();
    window.location.reload();
};