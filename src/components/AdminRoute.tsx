import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import FullScreenMessage from "./FullScreenMessage";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") {
    return <FullScreenMessage>Carregando...</FullScreenMessage>;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  // Usuário autenticado mas sem role admin: manda de volta pra home em vez
  // de mostrar uma tela de "403" -- a rota de gestão de usuários nem
  // deveria aparecer pra quem não é admin (não tem link pra ela no Home).
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}