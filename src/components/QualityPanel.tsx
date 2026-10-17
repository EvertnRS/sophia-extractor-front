import type { FieldSource, QualityBlock } from "../api/extraction";
import { getFieldLabel } from "../data/fieldLabels";
import {
    BADGE_CLASSES,
    BADGE_LABELS,
    CALIBRATION_NOTICE,
    LEGEND,
    countBadges,
    countNoAnswer,
    describeDocument,
    describeFieldConfidence,
    describePages,
    type BadgeKind,
} from "../data/confidence";

interface Props {
    structuredData: Record<string, unknown>;
    fieldSources: Record<string, FieldSource>;
    quality: QualityBlock | null | undefined;
    // Chaves em foco na lista (null = lista completa).
    focusKeys: string[] | null;
    onFocus: (keys: string[] | null) => void;
}

const COUNT_ORDER: BadgeKind[] = [
    "baixa",
    "media",
    "alta",
    "sem_mencao",
    "sem_avaliacao",
];

function Pill({ kind, children }: { kind: BadgeKind; children: React.ReactNode }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE_CLASSES[kind]}`}
        >
            {children}
        </span>
    );
}

/**
 * Painel de confiança do documento: leitura do PDF, contagem por selo, fila
 * "conferir primeiro" e legenda. O aviso de indicador não calibrado fica
 * sempre visível. Sem nenhum dado de confiança (registro salvo, backend
 * antigo) o painel não aparece.
 */
export default function QualityPanel({
    structuredData,
    fieldSources,
    quality,
    focusKeys,
    onFocus,
}: Props) {
    const { counts, evaluated } = countBadges(structuredData, fieldSources);
    const { counts: noAnswer, total: noAnswerTotal } = countNoAnswer(
        structuredData,
        fieldSources
    );

    if (!quality && evaluated === 0 && noAnswerTotal === 0) return null;

    const documentSummary = describeDocument(quality);
    const pagesText = describePages(quality);

    // Só chaves que existem em `structured_data` entram na fila. Um campo em
    // branco `baixa` ("quase marcado") também está lá, com valor `null`, e é
    // alvo útil: o risco é uma marcação perdida (WP-C7).
    const review = (quality?.campos_para_revisar ?? []).filter(
        (key): key is string => typeof key === "string" && key in structuredData
    );

    const focusActive = focusKeys !== null;

    return (
        <section
            aria-label="Confiança da extração"
            className="mb-6 rounded-2xl border border-blush bg-blush-soft p-5"
        >
            <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-lg font-bold text-ink">
                    Confiança da extração
                </h3>
                {quality && (
                    <Pill kind={documentSummary.kind}>
                        {documentSummary.headline}
                    </Pill>
                )}
            </div>

            <p className="mt-2 text-xs text-mauve">{CALIBRATION_NOTICE}</p>

            {quality && (documentSummary.reasons.length > 0 || pagesText) && (
                <p className="mt-2 text-xs text-gray-600">
                    {[...documentSummary.reasons, pagesText]
                        .filter(Boolean)
                        .join(" ")}
                    {documentSummary.kind === "baixa" &&
                        " Páginas sem identificação podem ser gráficos ou páginas sem conteúdo clínico: esta faixa mede a leitura do PDF, não a correção dos campos."}
                </p>
            )}

            {evaluated > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {COUNT_ORDER.filter((kind) => counts[kind] > 0).map((kind) => (
                        <Pill key={kind} kind={kind}>
                            {BADGE_LABELS[kind]}
                            <span className="font-bold">{counts[kind]}</span>
                        </Pill>
                    ))}
                </div>
            )}

            {noAnswerTotal > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-semibold text-ink">
                        Campos sem resposta
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                        Ficaram em branco. A faixa mede o quanto o vazio é
                        claro; não é um valor lido.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {noAnswer.quase_marcado > 0 && (
                            <Pill kind="baixa">
                                Quase marcado
                                <span className="font-bold">{noAnswer.quase_marcado}</span>
                            </Pill>
                        )}
                        {noAnswer.nao_localizado > 0 && (
                            <Pill kind="sem_avaliacao">
                                Não localizado
                                <span className="font-bold">{noAnswer.nao_localizado}</span>
                            </Pill>
                        )}
                        {noAnswer.media > 0 && (
                            <Pill kind="sem_avaliacao">
                                Em branco (média)
                                <span className="font-bold">{noAnswer.media}</span>
                            </Pill>
                        )}
                        {noAnswer.alta > 0 && (
                            <Pill kind="sem_avaliacao">
                                Em branco (alta)
                                <span className="font-bold">{noAnswer.alta}</span>
                            </Pill>
                        )}
                        {noAnswer.outro > 0 && (
                            <Pill kind="sem_avaliacao">
                                Outros
                                <span className="font-bold">{noAnswer.outro}</span>
                            </Pill>
                        )}
                    </div>
                </div>
            )}

            {review.length > 0 && (
                <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-ink">
                            Conferir primeiro
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => onFocus(review)}
                                className="rounded-full border border-maroon px-3 py-1 font-semibold text-maroon hover:bg-salmon-light"
                            >
                                Mostrar só estes {review.length}
                            </button>
                            {focusActive && (
                                <button
                                    type="button"
                                    onClick={() => onFocus(null)}
                                    className="rounded-full border px-3 py-1 text-gray-600 hover:bg-white"
                                >
                                    Ver todos os campos
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                        Em ordem de prioridade. Clique em um campo para ver só ele.
                    </p>

                    <ol className="mt-3 flex flex-wrap gap-2">
                        {review.map((key, index) => {
                            const badge = describeFieldConfidence(fieldSources[key]);
                            const label = getFieldLabel(key, key.replaceAll("_", " "));
                            return (
                                <li key={key}>
                                    <button
                                        type="button"
                                        onClick={() => onFocus([key])}
                                        title={badge?.label ?? "Sem avaliação"}
                                        className={`rounded-full border px-3 py-1 text-xs hover:opacity-80 ${
                                            BADGE_CLASSES[badge?.kind ?? "sem_avaliacao"]
                                        } ${
                                            focusKeys?.length === 1 && focusKeys[0] === key
                                                ? "ring-2 ring-maroon"
                                                : ""
                                        }`}
                                    >
                                        <span className="mr-1 font-bold">{index + 1}.</span>
                                        {label}
                                        {badge?.noAnswer && badge.kind === "baixa" && (
                                            <span className="ml-1 font-normal">
                                                (sem resposta, quase marcado)
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            <details className="mt-4 text-xs text-gray-600">
                <summary className="cursor-pointer font-semibold text-mauve">
                    Como ler os selos
                </summary>
                <ul className="mt-2 space-y-1.5">
                    {LEGEND.map((item) => (
                        <li key={item.kind} className="flex items-start gap-2">
                            <Pill kind={item.kind}>{BADGE_LABELS[item.kind]}</Pill>
                            <span className="pt-0.5">{item.text}</span>
                        </li>
                    ))}
                </ul>
            </details>
        </section>
    );
}