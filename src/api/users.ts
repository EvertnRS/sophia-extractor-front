import { api } from "./api";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export async function listUsers() {
  const response = await api.get<AdminUser[]>("/auth/users");
  return response.data;
}

export async function createUser(payload: CreateUserPayload) {
  const response = await api.post<AdminUser>("/auth/users", payload);
  return response.data;
}

export async function updateUser(userId: string, payload: UpdateUserPayload) {
  const response = await api.patch<AdminUser>(`/auth/users/${userId}`, payload);
  return response.data;
}

// Soft delete no backend (marca is_active = false) -- ver
// AuthService.deactivate_user. Reativar um usuário é um updateUser comum
// com { is_active: true }, não um endpoint separado.
export async function deactivateUser(userId: string) {
  const response = await api.delete<AdminUser>(`/auth/users/${userId}`);
  return response.data;
}