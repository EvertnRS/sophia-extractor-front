import { useEffect, useState } from "react";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import {
    generateLlmReport,
    getLlmReport,
    type LlmReport,
} from "../api/llmReport";
import { formatDateTime } from "../utils/formatDate";

interface Props {
    dnv: string;
    ownerId?: string | null;
}

export default function LlmReportPanel({ dnv, ownerId }: Props) {
    const [report, setReport] = useState<LlmReport | null>(null);
    const [isLoadingLast, setIsLoadingLast] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        getLlmReport(dnv, ownerId)
            .then((last) => {
                if (!cancelled) setReport(last);
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

    async function handleGenerate() {
        try {
            setError(null);
            setIsGenerating(true);
            setReport(await generateLlmReport(dnv, ownerId));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Não foi possível gerar o relatório."
            );
        } finally {
            setIsGenerating(false);
        }
    }

    const generatedAt = formatDateTime(report?.created_at);

    return (
        <section className="mt-6 rounded-2xl border border-blush bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <FileText size={22} className="text-maroon" />
                    <h3 className="font-display text-xl font-semibold text-ink">
                        Relatório textual
                    </h3>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || isLoadingLast}
                    className="flex items-center gap-2 rounded-full bg-espresso px-6 py-2 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isGenerating ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                    {isGenerating
                        ? "Gerando..."
                        : report
                            ? "Gerar novamente"
                            : "Gerar relatório"}
                </button>
            </div>

            {report?.is_stale && (
                <p className="mt-4 rounded-xl bg-blush-soft p-3 text-sm text-maroon">
                    Os dados foram alterados depois deste relatório. Gere
                    novamente para atualizar o texto.
                </p>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {isLoadingLast && (
                <p className="mt-4 text-sm text-gray-500">
                    Verificando relatório anterior...
                </p>
            )}

            {!isLoadingLast && !report && !error && (
                <p className="mt-4 text-sm text-gray-500">
                    Este registro ainda não tem relatório gerado.
                </p>
            )}

            {report && (
                <div className="mt-6">
                    <div className="whitespace-pre-wrap rounded-xl bg-blush-soft p-5 text-sm leading-7 text-gray-700">
                        {report.report_text}
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                        Modelo {report.model_name}
                        {report.model_version
                            ? ` v${report.model_version}`
                            : ""}
                        {generatedAt ? ` · gerado em ${generatedAt}` : ""}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                        Este relatório é gerado por Inteligência Artificial e pode conter erros.
                    </p>
                </div>
            )}
        </section>
    );
}
