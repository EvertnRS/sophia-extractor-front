import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [status, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Informe email e senha.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const responseStatus = err.response?.status;

        if (responseStatus === 401) {
          setError("Email ou senha inválidos.");
          return;
        }

        if (responseStatus === 403) {
          setError("Usuário inativo. Fale com um administrador.");
          return;
        }
      }

      setError("Não foi possível fazer login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCFBFA] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-[#E8C8C5] bg-white p-10 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-[#4A3534]">Entrar</h1>

        <p className="mt-2 text-gray-600">
          Acesse o SophIA com seu email e senha.
        </p>

        <label className="mt-8 block text-sm font-medium text-[#4A3534]">
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#B67B73]"
          />
        </label>

        <label className="mt-5 block text-sm font-medium text-[#4A3534]">
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#B67B73]"
          />
        </label>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full rounded-full bg-[#4A3534] px-8 py-3 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}