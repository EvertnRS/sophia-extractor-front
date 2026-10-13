import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/useAuth";
import LoginIllustration from "../components/LoginIllustration";

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
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

  function handleForgotPassword(event: MouseEvent) {
    event.preventDefault();
    // Não existe fluxo de "esqueci minha senha" self-service hoje -- só um
    // admin pode redefinir a senha de alguém (PATCH /auth/users/{id}).
    setForgotPasswordMessage(
      "Ainda não temos redefinição automática de senha. Fale com um administrador do sistema."
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <span className="font-display text-2xl font-bold text-espresso">
            soph<span className="text-maroon">IA</span>
          </span>
          <p className="mt-1 text-sm text-gray-500">
            Ciência de dados a serviço da vida neonatal
          </p>

          <h1 className="mt-10 font-display text-lg text-gray-500">Olá,</h1>
          <p className="font-display text-3xl font-bold text-ink">
            Bom ter você de volta
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-blush bg-blush-soft px-4 py-3 outline-none focus:border-maroon"
              />
            </label>

            <label className="mt-5 block text-sm font-medium text-ink">
              Senha
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-blush bg-blush-soft px-4 py-3 pr-12 outline-none focus:border-maroon"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-espresso"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full rounded-full bg-ink px-8 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Entrando..." : "Login"}
            </button>

            <div className="mt-5 text-center">
              <a
                href="#"
                onClick={handleForgotPassword}
                className="text-sm text-maroon hover:underline"
              >
                Esqueci a senha
              </a>

              {forgotPasswordMessage && (
                <p className="mt-3 text-sm text-gray-500">{forgotPasswordMessage}</p>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="hidden lg:block">
        <LoginIllustration />
      </div>
    </div>
  );
}