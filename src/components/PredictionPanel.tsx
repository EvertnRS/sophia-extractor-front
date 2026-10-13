import { useEffect, useState } from "react";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import {
    getPrediction,
    runPrediction,
    type Prediction,
} from "../api/prediction";
import { formatDateTime } from "../utils/formatDate";

interface Props {
    dnv: string;
    /** Dono do registro (só importa para admin, quando o DNV é compartilhado). */
    ownerId?: string | null;
}

export default function PredictionPanel({ dnv, ownerId }: Props) {
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [isLoadingLast, setIsLoadingLast] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // O estado inicial já é "carregando, sem predição"; ao trocar de registro
    // o pai remonta o painel via `key` (ver pages/Prediction.tsx), sem
    // resetar aqui. Ao abrir, mostra a última predição já calculada (se houver), em vez de
    // obrigar o usuário a recalcular só para ver o resultado.
    useEffect(() => {
        let cancelled = false;

        getPrediction(dnv, ownerId)
            .then((last) => {
                if (!cancelled) setPrediction(last);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setIsLoadingLast(false);
            });

        return () => {
            cancelled = true;
        };
    }, [dnv, ownerId]);

    async function handleRun() {
        try {
            setError(null);
            setIsRunning(true);
            setPrediction(await runPrediction(dnv, ownerId));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Não foi possível calcular a predição."
            );
        } finally {
            setIsRunning(false);
        }
    }

    const isSuccess =
        prediction?.status === "success" &&
        prediction.predicted_probability !== undefined;
    const percent = isSuccess
        ? Math.round((prediction.predicted_probability as number) * 1000) / 10
        : 0;
    const isPositive = isSuccess && prediction.predicted_class === 1;
    const missing = prediction?.missing_features ?? [];
    const calculatedAt = formatDateTime(prediction?.created_at);

    return (
        <section className="rounded-2xl border border-blush bg-blush-soft p-6">

            <div className="flex flex-wrap items-center justify-between gap-4">

                <div className="flex items-center gap-3">
                    <Activity size={22} className="text-maroon" />
                    <h3 className="font-display text-xl font-semibold text-ink">
                        Predição de risco de sepse neonatal
                    </h3>
                </div>

                <button
                    onClick={handleRun}
                    disabled={isRunning || isLoadingLast}
                    className="flex items-center gap-2 rounded-full bg-espresso px-6 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isRunning ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                    {isRunning
                        ? "Calculando..."
                        : prediction
                            ? "Recalcular"
                            : "Calcular predição"}
                </button>

            </div>

            {prediction?.is_stale && (
                <p className="mt-4 rounded-xl bg-white p-3 text-sm text-maroon">
                    Os dados foram alterados depois deste cálculo. Recalcule
                    para atualizar o resultado.
                </p>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {isLoadingLast && (
                <p className="mt-4 text-sm text-gray-500">
                    Verificando predição anterior...
                </p>
            )}

            {!isLoadingLast && !prediction && !error && (
                <p className="mt-4 text-sm text-gray-500">
                    Esta extração ainda não tem predição calculada.
                </p>
            )}

            {prediction?.status === "error" && (
                <p className="mt-4 text-sm text-red-600">
                    A última tentativa de cálculo falhou. Tente recalcular.
                </p>
            )}

            {isSuccess && (
                <div className="mt-6">

                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Probabilidade estimada
                            </p>
                            <p className="font-display text-4xl font-bold text-ink">
                                {percent.toLocaleString("pt-BR")}%
                            </p>
                        </div>

                        <span
                            className={`rounded-full px-4 py-1 text-sm font-semibold ${
                                isPositive
                                    ? "bg-maroon text-white"
                                    : "bg-salmon-light text-ink"
                            }`}
                        >
                            {isPositive ? "Classe positiva" : "Classe negativa"}
                        </span>
                    </div>

                    <div
                        className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Probabilidade estimada de sepse"
                    >
                        <div
                            className={`h-full rounded-full ${
                                isPositive ? "bg-maroon" : "bg-salmon"
                            }`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                        Classe positiva = probabilidade ≥ 50%.
                    </p>

                    {prediction.features_total !== null && (
                        <p className="mt-4 text-sm text-gray-600">
                            Variáveis preenchidas:{" "}
                            <strong>
                                {prediction.features_filled} de{" "}
                                {prediction.features_total}
                            </strong>
                            . Quanto menos variáveis, menos confiável o
                            resultado.
                        </p>
                    )}

                    {missing.length > 0 && (
                        <details className="mt-2 text-sm text-gray-600">
                            <summary className="cursor-pointer">
                                Ver variáveis ausentes ({missing.length})
                            </summary>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {missing.map((name) => (
                                    <span
                                        key={name}
                                        className="rounded-full border border-blush bg-white px-3 py-1 text-xs"
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </details>
                    )}

                    <p className="mt-4 rounded-xl bg-white p-3 text-xs text-gray-500">
                        {prediction.disclaimer}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                        Modelo {prediction.model_name}
                        {prediction.model_version
                            ? ` v${prediction.model_version}`
                            : ""}
                        {calculatedAt ? ` · calculado em ${calculatedAt}` : ""}
                    </p>

                </div>
            )}

        </section>
    );
}