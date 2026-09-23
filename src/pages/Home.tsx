import UploadCard from "../components/UploadCard";
import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";

export default function Home() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#FCFBFA]">

            <main className="mx-auto max-w-5xl px-6 py-16">

                <div className="flex flex-wrap items-start justify-between gap-6">

                    <div>
                        <h1 className="text-5xl font-bold text-[#4A3534]">
                            Extração de Dados
                        </h1>

                        <p className="mt-4 max-w-2xl text-lg text-gray-600">
                            Faça o upload de uma ficha médica em PDF para extrair automaticamente
                            as informações utilizando o mecanismo do SophIA.
                        </p>
                    </div>

                    {user && (
                        <div className="flex shrink-0 flex-col items-end gap-2 pt-2 text-right">
                            <div>
                                <p className="text-sm font-medium text-[#4A3534]">
                                    {user.email}
                                </p>
                                <p className="text-xs uppercase tracking-wide text-gray-400">
                                    {user.role === "admin" ? "Administrador" : "Usuário"}
                                </p>
                            </div>

                            <button
                                onClick={logout}
                                className="rounded-full border border-[#E8C8C5] px-4 py-1.5 text-sm text-[#4A3534] transition hover:bg-[#F8F3F2]"
                            >
                                Sair
                            </button>

                            {user.role === "admin" && (
                                <Link
                                    to="/admin/usuarios"
                                    className="text-sm text-[#B67B73] hover:underline"
                                >
                                    Gestão de usuários
                                </Link>
                            )}
                        </div>
                    )}

                </div>

                <UploadCard />

            </main>

        </div>
    );
}