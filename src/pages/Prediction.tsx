import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Activity, RefreshCw } from "lucide-react";
import AppHeader from "../components/Appheader";
import PredictionPanel from "../components/PredictionPanel";
import { useAuth } from "../context/useAuth";
import {
    listStructuredData,
    type StructuredDataRecord,
} from "../api/structuredData";
import { normalizeFieldKey } from "../data/fieldDescriptions";
import { formatDateTime } from "../utils/formatDate";

/** Identificador estável de um registro: o mesmo DNV pode ter mais de um dono (admin). */
function recordKey(record: Pick<StructuredDataRecord, "dnv" | "owner_id">) {
    return `${record.dnv}|${record.owner_id ?? ""}`;
}

export default function Prediction() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [records, setRecords] = useState<StructuredDataRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Incrementar força um novo carregamento (botão "Atualizar").
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;

        listStructuredData()
            .then((data) => {
                if (cancelled) return;
                setRecords(data);
                setLoadError(null);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setLoadError("Não foi possível carregar os registros salvos.");
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [reloadToken]);

    function reload() {
        setIsLoading(true);
        setReloadToken((token) => token + 1);
    }

    const sortedRecords = useMemo(
        () =>
            [...records].sort((a, b) =>
                (b.updated_at ?? "").localeCompare(a.updated_at ?? "")
            ),
        [records]
    );

    const filteredRecords = useMemo(() => {
        const query = normalizeFieldKey(search);
        if (!query) return sortedRecords;

        return sortedRecords.filter((record) =>
            normalizeFieldKey(record.dnv).includes(query)
        );
    }, [sortedRecords, search]);

    // A seleção vive na URL (?dnv=...&owner=...): dá para linkar direto de
    // outras telas (ex.: do modal de resultado) e sobrevive a um F5.
    const selected = useMemo(() => {
        const dnv = searchParams.get("dnv");
        if (!dnv) return null;

        const candidates = records.filter((record) => record.dnv === dnv);
        const ownerParam = searchParams.get("owner");

        return (
            candidates.find((record) => (record.owner_id ?? "") === ownerParam) ??
            // Sem ?owner= e DNV compartilhado (só admin vê): prefere o próprio.
            candidates.find((record) => record.owner_id === user?.id) ??
            candidates[0] ??
            null
        );
    }, [records, searchParams, user?.id]);

    function select(record: StructuredDataRecord) {
        const next: Record<string, string> = { dnv: record.dnv };
        if (record.owner_id) next.owner = record.owner_id;
        setSearchParams(next, { replace: true });
    }

    const isAdmin = user?.role === "admin";

    return (
        <div className="min-h-screen bg-cream">

            <AppHeader />

            <main className="mx-auto max-w-5xl px-6 py-16">

                <h1 className="mt-2 font-display text-5xl font-bold text-ink">
                    Predição de Risco
                </h1>

                <p className="mt-4 max-w-2xl text-lg text-gray-600">
                    Escolha um registro salvo para calcular o risco de sepse
                    neonatal. A predição usa sempre os dados revisados e
                    salvos na tela de extração.
                </p>

                <div className="mt-10 grid gap-6 lg:grid-cols-[320px_1fr]">

                    {/* Lista de registros */}
                    <section className="rounded-3xl border border-blush bg-white p-5">

                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="font-display text-xl font-semibold text-ink">
                                Registros salvos
                            </h2>

                            <button
                                onClick={reload}
                                disabled={isLoading}
                                aria-label="Atualizar lista"
                                className="rounded-full border border-blush p-2 text-ink transition hover:bg-blush-soft disabled:opacity-40"
                            >
                                <RefreshCw
                                    size={16}
                                    className={isLoading ? "animate-spin" : ""}
                                />
                            </button>
                        </div>

                        <input
                            className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-maroon"
                            placeholder="Buscar por DNV..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {loadError && (
                            <p className="text-sm text-red-600">{loadError}</p>
                        )}

                        {!loadError && !isLoading && records.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Nenhum registro salvo ainda.{" "}
                                <Link to="/" className="text-maroon underline">
                                    Faça uma extração
                                </Link>{" "}
                                e salve os dados para poder calcular a
                                predição.
                            </p>
                        )}

                        {records.length > 0 && filteredRecords.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Nenhum DNV encontrado para essa busca.
                            </p>
                        )}

                        <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
                            {filteredRecords.map((record) => {
                                const isSelected =
                                    selected !== null &&
                                    recordKey(record) === recordKey(selected);

                                return (
                                    <li key={recordKey(record)}>
                                        <button
                                            onClick={() => select(record)}
                                            aria-pressed={isSelected}
                                            className={`w-full rounded-2xl border p-4 text-left transition hover:border-espresso ${
                                                isSelected
                                                    ? "border-espresso bg-blush-soft"
                                                    : "border-blush bg-cream"
                                            }`}
                                        >
                                            <p className="text-xs text-gray-500">DNV</p>
                                            <p className="font-semibold text-ink">
                                                {record.dnv}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Atualizado em{" "}
                                                {formatDateTime(record.updated_at) ?? "—"}
                                            </p>
                                            {isAdmin && record.owner_id && (
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Dono: …{record.owner_id.slice(-6)}
                                                </p>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                    </section>

                    {/* Detalhe: predição do registro escolhido */}
                    <section>

                        {selected ? (
                            <>
                                <p className="mb-3 text-sm text-gray-500">
                                    Registro{" "}
                                    <strong className="text-ink">{selected.dnv}</strong>
                                </p>

                                <PredictionPanel
                                    key={recordKey(selected)}
                                    dnv={selected.dnv}
                                    ownerId={selected.owner_id}
                                />
                            </>
                        ) : (
                            <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blush bg-white p-10 text-center">
                                <Activity size={40} className="text-mauve" />
                                <p className="mt-4 text-gray-500">
                                    {searchParams.get("dnv") && !isLoading
                                        ? "Registro não encontrado. Escolha um da lista."
                                        : "Selecione um registro da lista para ver ou calcular a predição."}
                                </p>
                            </div>
                        )}

                    </section>

                </div>

            </main>

        </div>
    );
}