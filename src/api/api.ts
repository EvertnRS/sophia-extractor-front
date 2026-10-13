import axios from "axios";
import { getToken } from "./authStorage";
import { MOCK_API_BASE } from "../mocks/config";

// Um único cliente axios para toda a API (extração em `/api/...` e CRUD de
// dados estruturados em `/...`, ambos no mesmo host) -- centraliza aqui a
// injeção do token e o tratamento de sessão expirada/revogada, em vez de
// duplicar isso em cada arquivo de api/*.ts.
//
// Modo mock (`npm run dev:mock`): em vez do backend, as chamadas vão para um
// caminho do próprio site que o MSW responde com dados sintéticos
// (ver src/mocks/ e o README).
const useMock = import.meta.env.VITE_USE_MOCK === "true";
const baseURL = useMock
  ? MOCK_API_BASE
  : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000");

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";

    // POST /auth/login trata os próprios erros (401 = senha errada, 403 =
    // usuário inativo) na tela de login -- não deve disparar um logout
    // "forçado" global, ou a mensagem de erro nunca chegaria a aparecer.
    const isLoginRequest = url.includes("/auth/login");

    if (!isLoginRequest && (status === 401 || status === 403)) {
      // O backend revalida o usuário a cada requisição autenticada (não
      // só no login): um token que já foi válido pode passar a ser
      // rejeitado a qualquer momento (expirou, ou o usuário foi
      // desativado por um admin). Em vez de importar o AuthContext aqui
      // (e criar um ciclo de dependência), avisamos por evento -- quem
      // escuta e decide o que fazer é o `AuthProvider`.
      window.dispatchEvent(new Event("auth:logout"));
    }

    return Promise.reject(error);
  }
);