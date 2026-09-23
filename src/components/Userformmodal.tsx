import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import { createUser, updateUser, type AdminUser } from "../api/users";

interface UserFormModalProps {
  mode: "create" | "edit";
  user?: AdminUser;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return fallback;
}

export default function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role ?? "user");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reseta o formulário sempre que o usuário-alvo mudar (ex.: abrir
  // "Editar" em outra linha da tabela sem fechar e reabrir o modal).
  useEffect(() => {
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "user");
    setPassword("");
    setError(null);
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Email é obrigatório.");
      return;
    }

    if (mode === "create" && password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (mode === "edit" && password.length > 0 && password.length < 8) {
      setError("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "create") {
        await createUser({ email: trimmedEmail, password, role });
      } else if (user) {
        // Em edição, senha em branco significa "não alterar" -- só manda
        // o campo `password` pro backend se algo foi digitado.
        await updateUser(user.id, {
          email: trimmedEmail,
          role,
          ...(password ? { password } : {}),
        });
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          mode === "create"
            ? "Não foi possível criar o usuário."
            : "Não foi possível salvar as alterações."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-[#4A3534]">
          {mode === "create" ? "Novo usuário" : "Editar usuário"}
        </h2>

        <label className="mt-6 block text-sm font-medium text-[#4A3534]">
          Email
          <input
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#B67B73]"
          />
        </label>

        <label className="mt-5 block text-sm font-medium text-[#4A3534]">
          {mode === "create" ? "Senha" : "Nova senha"}
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "edit" ? "Deixe em branco para não alterar" : ""}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#B67B73]"
          />
        </label>

        <label className="mt-5 block text-sm font-medium text-[#4A3534]">
          Função
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#B67B73]"
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </label>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-gray-300 px-6 py-2 text-[#4A3534] transition hover:bg-[#F8F3F2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#4A3534] px-6 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}