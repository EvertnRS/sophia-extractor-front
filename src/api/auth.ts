    import { api } from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export async function login(payload: LoginPayload) {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  return response.data;
}

export async function getMe() {
  const response = await api.get<CurrentUser>("/auth/me");
  return response.data;
}