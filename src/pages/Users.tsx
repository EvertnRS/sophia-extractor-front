import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  deactivateUser,
  listUsers,
  updateUser,
  type AdminUser,
} from "../api/users";
import { useAuth } from "../context/useAuth";
import UserFormModal from "../components/Userformmodal";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return fallback;
}

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [pendingActionUserId, setPendingActionUserId] = useState<string | null>(null);

  async function loadUsers() {
    try {
      setLoadError(null);
      setIsLoading(true);
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Não foi possível carregar os usuários."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreateModal() {
    setEditingUser(null);
    setModalMode("create");
  }

  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingUser(null);
  }

  async function toggleActive(user: AdminUser) {
    const actionLabel = user.is_active ? "desativar" : "ativar";

    if (
      user.is_active &&
      !window.confirm(`Desativar ${user.email}? A pessoa não vai mais conseguir fazer login.`)
    ) {
      return;
    }

    try {
      setActionError(null);
      setPendingActionUserId(user.id);

      // Reativar não é um endpoint separado -- é o mesmo PATCH usado na
      // edição, só que setando is_active de volta pra true. Desativar
      // continua sendo o soft delete (DELETE /auth/users/{id}).
      if (user.is_active) {
        await deactivateUser(user.id);
      } else {
        await updateUser(user.id, { is_active: true });
      }

      await loadUsers();
    } catch (err) {
      // Cobre inclusive o 409 de "último admin ativo" vindo do backend --
      // a mensagem já vem pronta em português (ver AuthService).
      setActionError(extractErrorMessage(err, `Não foi possível ${actionLabel} o usuário.`));
    } finally {
      setPendingActionUserId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFBFA]">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link to="/" className="text-sm text-[#B67B73] hover:underline">
              ← Voltar
            </Link>

            <h1 className="mt-2 text-4xl font-bold text-[#4A3534]">
              Gestão de usuários
            </h1>

            <p className="mt-2 max-w-2xl text-gray-600">
              Crie, edite e desative o acesso de profissionais ao SophIA.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="rounded-full bg-[#4A3534] px-6 py-3 text-white transition hover:opacity-90"
          >
            Novo usuário
          </button>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-[#E8C8C5] bg-white">
          {loadError && <p className="p-6 text-sm text-red-600">{loadError}</p>}

          {actionError && (
            <p className="border-b border-[#E8C8C5] bg-red-50 p-4 text-sm text-red-600">
              {actionError}
            </p>
          )}

          {!loadError && isLoading && (
            <p className="p-6 text-sm text-gray-500">Carregando usuários...</p>
          )}

          {!loadError && !isLoading && users.length === 0 && (
            <p className="p-6 text-sm text-gray-500">Nenhum usuário cadastrado.</p>
          )}

          {!loadError && users.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#E8C8C5] text-gray-500">
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Função</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#F1E4E3] last:border-0">
                    <td className="px-6 py-4 text-[#4A3534]">
                      {user.email}
                      {user.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-gray-400">(você)</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {user.role === "admin" ? "Administrador" : "Usuário"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-[#B67B73] hover:underline"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => toggleActive(user)}
                          disabled={pendingActionUserId === user.id}
                          className="text-[#B67B73] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {user.is_active ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modalMode && (
        <UserFormModal
          mode={modalMode}
          user={editingUser ?? undefined}
          onClose={closeModal}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
}