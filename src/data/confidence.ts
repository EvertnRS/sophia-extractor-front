import type {
    ConfidenceBand,
    FieldSource,
    QualityBlock,
    QualityReason,
} from "../api/extraction";

/**
 * Apresentação da confiança da extração (M-11). Tudo aqui é puro: recebe o que
 * o backend mandou e devolve texto e classes. Regras que a tela NÃO pode
 * quebrar:
 *
 *  - A faixa é o dado de negócio; o número (`confianca`) é auxiliar e NÃO
 *    calibrado. Só aparece no tooltip, como "índice 0,92", nunca como
 *    percentual e nunca como texto principal.
 *  - Sem faixa (`null`) é sempre cinza e nunca verde. "Sem avaliação" não
 *    significa valor confiável nem errado.
 *  - Faixa `alta` não garante que o valor está correto: mede o sinal de
 *    leitura, não o acerto. Por isso o aviso fica sempre visível no painel.
 *  - GLiNER `ausencia` (o modelo não achou menção) aparece como "Sem menção",
 *    em cinza, e não como nível de confiança.
 *  - Campo sem entrada em `field_sources` (registro salvo, backend antigo)
 *    não ganha selo: não se inventa avaliação.
 */

export type BadgeKind =
    | "alta"
    | "media"
    | "baixa"
    | "sem_avaliacao"
    | "sem_mencao";

export interface FieldConfidence {
    kind: BadgeKind;
    label: string;
    // Uma linha por item do tooltip, da mais importante para a menos.
    tooltip: string[];
    // Campo SEM valor (em branco ou não localizado). Não é um selo novo: usa
    // um dos cinco selos e só serve para a tela explicar "sem resposta".
    noAnswer?: boolean;
}

export const BADGE_LABELS: Record<BadgeKind, string> = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
    sem_avaliacao: "Sem avaliação",
    sem_mencao: "Sem menção",
};

// Semáforo (decisão M-11): alta verde, média âmbar, baixa vermelho. "Sem
// avaliação" e "Sem menção" ficam em cinza tracejado.
export const BADGE_CLASSES: Record<BadgeKind, string> = {
    alta: "border-green-200 bg-green-50 text-green-800",
    media: "border-amber-200 bg-amber-50 text-amber-800",
    baixa: "border-red-200 bg-red-50 text-red-800",
    sem_avaliacao: "border-dashed border-gray-300 bg-gray-100 text-gray-500",
    sem_mencao: "border-dashed border-gray-300 bg-gray-100 text-gray-500",
};

const BAND_HINTS: Record<ConfidenceBand, string> = {
    alta: "Sinal de leitura consistente. Não garante que o valor esteja correto.",
    media: "Sinal intermediário: vale conferir com a ficha.",
    baixa: "Sinal fraco: confira com a ficha antes de salvar.",
};

// Motivos de `sinais.motivo_sem_faixa` (backend: KNOWN_MOTIVOS). Motivo novo
// ou desconhecido cai no texto genérico, nunca quebra.
const MOTIVO_TEXTS: Record<string, string> = {
    circulo_nao_detectado: "O círculo da marcação não foi detectado na ficha.",
    fonte_sem_margem: "A fonte deste campo não informa o quanto a marcação ficou clara.",
    texto_sem_score: "Valor lido de texto, sem pontuação de leitura (OCR) disponível.",
    multiplas_fontes: "O valor combina várias fontes, então não há um único sinal de leitura.",
    default_clinico: "Valor padrão assumido, sem leitura direta no PDF.",
    origem_sem_faixa: "A origem deste valor ainda não é avaliada.",
    gliner_sem_sinal: "O modelo não produziu sinal para avaliar este campo.",
    sem_regra_de_sinal: "Este campo ainda não tem regra de avaliação.",
};
const MOTIVO_GENERIC = "Este campo não foi avaliado.";

const NOT_EVALUATED_NOTE =
    "Sem avaliação não significa valor confiável nem errado.";

const ABSENCE_NOTE =
    "O modelo não encontrou menção a este campo no texto lido. É ausência de sinal, não prova de que o valor está correto.";

const MIXED_NOTE =
    "Parte dos votos foi silêncio do modelo; a faixa vem só dos trechos encontrados.";

// Textos de `sinais.rotulo` (origem sem faixa). Só `sem_mencao` tem selo
// próprio; os demais (regex, padrão clínico, desconhecido) usam "Sem
// avaliação" e explicam no tooltip. Nunca quebra.
const ROTULO_TEXTS: Record<string, string> = {
    regex: "Valor obtido por regra de texto (regex), sem pontuação de leitura. Não tem faixa de confiança.",
    padrao_clinico: "Valor padrão assumido, sem leitura direta no PDF. Não tem faixa de confiança.",
};

const BLANK_TEXTS = {
    em_branco:
        "O campo ficou em branco: nenhum círculo foi lido como marcado. A faixa mede o quanto o vazio é claro, não é um valor lido.",
    media: "Sinal intermediário de que o campo está em branco: vale conferir com a ficha.",
    baixa: "Algum círculo ficou quase marcado: o campo pode ter sido deixado em branco por pouco. Confira com a ficha.",
    nao_localizado:
        "O círculo da marcação não foi detectado na ficha: não há como dizer se o campo está em branco.",
    generic: "Campo sem valor, sem leitura do vazio disponível.",
};

const REBAIXE_TEXTS: Record<string, string> = {
    voto_contrario: "houve voto contra o valor escolhido",
    voto_unico: "só um episódio sustenta o valor",
};

function sourceNames(value: unknown): string[] {
    return Array.isArray(value)
        ? value
              .filter((item): item is string => typeof item === "string" && item !== "")
              .map((item) => item.replaceAll("_", " "))
        : [];
}

export function isBand(value: unknown): value is ConfidenceBand {
    return value === "alta" || value === "media" || value === "baixa";
}

/**
 * Índice auxiliar com vírgula decimal ("0,92"). Nunca percentual. Devolve
 * null se não for um número finito (confianca null = sem número, e está certo).
 */
export function formatIndex(value: unknown): string | null {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    const clamped = Math.min(1, Math.max(0, value));
    return clamped.toFixed(2).replace(".", ",");
}

function contraryVotes(source: FieldSource): number {
    const value = source.sinais?.votos_contrarios;
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.floor(value)
        : 0;
}

/**
 * Selo de um campo. Devolve null quando o campo não tem avaliação nenhuma a
 * mostrar: sem entrada em `field_sources`, ou entrada de um backend sem a
 * chave `faixa` (resposta antiga). `faixa: null` é diferente: é "sem
 * avaliação" explícita e ganha selo cinza.
 */
export function describeFieldConfidence(
    source: FieldSource | null | undefined
): FieldConfidence | null {
    if (!source || typeof source !== "object") return null;

    const tipo = source.sinais?.tipo_evidencia;
    const index = formatIndex(source.confianca);
    const indexLine = index ? `Índice ${index} (não calibrado).` : null;

    // (1) Campo SEM valor (backend 2.0.0): nunca vira selo de confiança comum.
    // Em branco com faixa `alta` não é "valor confiável" (sem verde).
    const semValor = source.sinais?.motivo_sem_valor;
    if (typeof semValor === "string") {
        return describeNoAnswer(source, semValor, indexLine);
    }

    if (!("faixa" in source)) return null;

    if (!isBand(source.faixa)) {
        // (2) Origem sem faixa COM rótulo: o rótulo faz o papel do motivo.
        const rotulo = source.sinais?.rotulo;
        if (typeof rotulo === "string" && rotulo !== "") {
            if (rotulo === "sem_mencao") {
                return {
                    kind: "sem_mencao",
                    label: BADGE_LABELS.sem_mencao,
                    tooltip: [ABSENCE_NOTE],
                };
            }
            return {
                kind: "sem_avaliacao",
                label: BADGE_LABELS.sem_avaliacao,
                tooltip: [ROTULO_TEXTS[rotulo] ?? MOTIVO_GENERIC, NOT_EVALUATED_NOTE],
            };
        }

        // (3) Sem faixa e sem rótulo: "sem avaliação" com o motivo, como antes.
        const motivo = source.sinais?.motivo_sem_faixa;
        const motivoText =
            typeof motivo === "string" && MOTIVO_TEXTS[motivo]
                ? MOTIVO_TEXTS[motivo]
                : MOTIVO_GENERIC;
        return {
            kind: "sem_avaliacao",
            label: BADGE_LABELS.sem_avaliacao,
            tooltip: [motivoText, NOT_EVALUATED_NOTE],
        };
    }

    const contrary = contraryVotes(source);
    const contraryLine =
        contrary > 0
            ? `Houve ${contrary} ${contrary === 1 ? "voto" : "votos"} contra o valor escolhido.`
            : null;

    // Silêncio do modelo não é um nível de confiança. Exceção: faixa baixa
    // (um único episódio sustentando o resultado) continua alerta vermelho.
    if (tipo === "ausencia" && source.faixa !== "baixa") {
        return {
            kind: "sem_mencao",
            label: BADGE_LABELS.sem_mencao,
            tooltip: [ABSENCE_NOTE],
        };
    }

    const lines: string[] = [BAND_HINTS[source.faixa]];
    if (tipo === "ausencia") {
        lines.push(
            "Sustentado só por ausência de menção em um único episódio."
        );
    }
    if (tipo === "misto") lines.push(MIXED_NOTE);
    if (contraryLine) lines.push(contraryLine);

    // (4) Faixa normal, com o que a limitou ou rebaixou, quando o backend diz.
    const semFaixa = sourceNames(source.sinais?.origens_sem_faixa);
    if (semFaixa.length > 0) {
        lines.push(
            source.faixa === "media"
                ? `Faixa limitada a média: a origem ${semFaixa.join(", ")} não tem avaliação.`
                : `Origem sem avaliação: ${semFaixa.join(", ")}.`
        );
    }
    const rebaixe = Array.isArray(source.sinais?.rebaixe)
        ? source.sinais.rebaixe.filter((item): item is string => typeof item === "string")
        : [];
    if (rebaixe.length > 0) {
        const motivos = rebaixe.map((item) => REBAIXE_TEXTS[item] ?? item.replaceAll("_", " "));
        lines.push(`Faixa rebaixada uma posição: ${motivos.join("; ")}.`);
    }

    if (indexLine) lines.push(indexLine);

    return {
        kind: source.faixa,
        label: BADGE_LABELS[source.faixa],
        tooltip: lines,
    };
}

/**
 * Selo de campo SEM valor (`sinais.motivo_sem_valor`), só com os cinco selos
 * existentes. Em branco com faixa alta ou média, e não localizado: "Sem
 * avaliação" (nunca verde nem âmbar). Em branco com faixa baixa ("quase
 * marcado"): "Baixa", vermelho, com o motivo no tooltip.
 */
function describeNoAnswer(
    source: FieldSource,
    motivo: string,
    indexLine: string | null
): FieldConfidence {
    const sinais = source.sinais;
    const detail: string[] = [];
    const naoLocalizadas = sourceNames(sinais?.fontes_nao_localizadas);

    if (motivo === "em_branco" && isBand(source.faixa)) {
        // Em branco NUNCA aparece como "Alta" nem "Média": a faixa mede o quanto
        // o vazio é claro, não um valor lido. Só o "quase marcado" (baixa) usa
        // o selo vermelho, porque é um alerta de marcação perdida.
        const kind: BadgeKind = source.faixa === "baixa" ? "baixa" : "sem_avaliacao";
        const label = BADGE_LABELS[kind];
        const lines: string[] = [
            source.faixa === "alta"
                ? BLANK_TEXTS.em_branco
                : source.faixa === "media"
                  ? BLANK_TEXTS.media
                  : BLANK_TEXTS.baixa,
        ];
        if (sinais?.teto_faixa === "media") {
            detail.push(
                naoLocalizadas.length > 0
                    ? `Faixa limitada a média: o círculo de ${naoLocalizadas.join(", ")} não foi detectado.`
                    : "Faixa limitada a média: um dos círculos não foi detectado."
            );
        } else if (naoLocalizadas.length > 0) {
            detail.push(`O círculo de ${naoLocalizadas.join(", ")} não foi detectado.`);
        }
        if (indexLine) detail.push(indexLine.replace("Índice", "Folga do vazio"));
        return { kind, label, tooltip: [...lines, ...detail], noAnswer: true };
    }

    if (motivo === "nao_localizado") {
        if (naoLocalizadas.length > 0) {
            detail.push(`Fontes sem círculo detectado: ${naoLocalizadas.join(", ")}.`);
        }
        return {
            kind: "sem_avaliacao",
            label: BADGE_LABELS.sem_avaliacao,
            tooltip: [BLANK_TEXTS.nao_localizado, ...detail, NOT_EVALUATED_NOTE],
            noAnswer: true,
        };
    }

    // Motivo novo ou em branco sem faixa válida: nunca quebra, nunca verde.
    return {
        kind: "sem_avaliacao",
        label: BADGE_LABELS.sem_avaliacao,
        tooltip: [BLANK_TEXTS.generic, NOT_EVALUATED_NOTE],
        noAnswer: true,
    };
}

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

export interface DocumentSummary {
    kind: BadgeKind;
    label: string;
    headline: string;
    reasons: string[];
}

const REASON_TEXTS: Record<string, string> = {
    expanded_ocr: "Muitas páginas precisaram de leitura ampliada (OCR mais pesado).",
    nao_identificadas: "Muitas páginas não foram identificadas.",
    cheap_ocr_mais_expanded_ocr: "Boa parte das páginas precisou de OCR.",
};

function reasonText(reason: QualityReason): string {
    return REASON_TEXTS[reason.criterio] ?? "Critério de leitura do PDF acionado.";
}

/**
 * Resumo da qualidade de leitura do PDF (`quality.faixa_documento`). Mede o
 * PDF, não a correção dos campos. Sem faixa de documento, "sem avaliação".
 */
export function describeDocument(
    quality: QualityBlock | null | undefined
): DocumentSummary {
    const band = quality?.faixa_documento;
    if (!isBand(band)) {
        return {
            kind: "sem_avaliacao",
            label: BADGE_LABELS.sem_avaliacao,
            headline: "Leitura do PDF sem avaliação",
            reasons: [],
        };
    }
    const headlines: Record<ConfidenceBand, string> = {
        alta: "Boa leitura do PDF",
        media: "Leitura regular do PDF",
        baixa: "Leitura difícil do PDF",
    };
    const reasons = Array.isArray(quality?.faixa_documento_motivos)
        ? quality.faixa_documento_motivos.map(reasonText)
        : [];
    return {
        kind: band,
        label: BADGE_LABELS[band],
        headline: headlines[band],
        reasons,
    };
}

/** "52 de 405 páginas não identificadas", ou null se faltar dado. */
export function describePages(quality: QualityBlock | null | undefined): string | null {
    const pages = quality?.paginas;
    if (!pages) return null;
    const total = pages.total_pdf ?? pages.total;
    const unidentified = Array.isArray(pages.nao_identificadas)
        ? pages.nao_identificadas.length
        : null;
    if (typeof total !== "number" || total <= 0 || unidentified === null) return null;
    return `${unidentified} de ${total} páginas não identificadas`;
}

// ---------------------------------------------------------------------------
// Contagem por selo (consistente com o que aparece na lista de campos)
// ---------------------------------------------------------------------------

export type BadgeCounts = Record<BadgeKind, number>;

/**
 * Conta os campos COM VALOR por tipo de selo. É calculado no cliente, a partir
 * dos mesmos dados que geram os selos, para o painel nunca discordar da lista
 * (ex.: o backend conta `sem menção` dentro de `media`; aqui são separados).
 */
export function countBadges(
    structuredData: Record<string, unknown>,
    fieldSources: Record<string, FieldSource>
): { counts: BadgeCounts; evaluated: number } {
    const counts: BadgeCounts = {
        alta: 0,
        media: 0,
        baixa: 0,
        sem_avaliacao: 0,
        sem_mencao: 0,
    };
    let evaluated = 0;
    for (const [key, source] of Object.entries(fieldSources)) {
        if (structuredData[key] === null || structuredData[key] === undefined) continue;
        const badge = describeFieldConfidence(source);
        if (!badge) continue;
        counts[badge.kind] += 1;
        evaluated += 1;
    }
    return { counts, evaluated };
}

export interface NoAnswerCounts {
    quase_marcado: number;
    nao_localizado: number;
    media: number;
    alta: number;
    outro: number;
}

/**
 * Conta os campos SEM valor que têm leitura do vazio (`motivo_sem_valor`).
 * Calculado no cliente, como `countBadges`. Campo com valor nunca entra aqui.
 */
export function countNoAnswer(
    structuredData: Record<string, unknown>,
    fieldSources: Record<string, FieldSource>
): { counts: NoAnswerCounts; total: number } {
    const counts: NoAnswerCounts = {
        quase_marcado: 0,
        nao_localizado: 0,
        media: 0,
        alta: 0,
        outro: 0,
    };
    let total = 0;
    for (const [key, source] of Object.entries(fieldSources)) {
        if (!(key in structuredData)) continue;
        const value = structuredData[key];
        if (value !== null && value !== undefined) continue;
        const motivo = source?.sinais?.motivo_sem_valor;
        if (typeof motivo !== "string") continue;
        if (motivo === "nao_localizado") counts.nao_localizado += 1;
        else if (motivo === "em_branco" && source.faixa === "baixa") counts.quase_marcado += 1;
        else if (motivo === "em_branco" && source.faixa === "media") counts.media += 1;
        else if (motivo === "em_branco" && source.faixa === "alta") counts.alta += 1;
        else counts.outro += 1;
        total += 1;
    }
    return { counts, total };
}

// ---------------------------------------------------------------------------
// Legenda e aviso (texto único, usado pelo painel)
// ---------------------------------------------------------------------------

export const CALIBRATION_NOTICE =
    "Indicador de prioridade de revisão, ainda não calibrado. Faixa alta não garante que o valor esteja correto, e sem avaliação não significa erro.";

export const LEGEND: { kind: BadgeKind; text: string }[] = [
    { kind: "alta", text: "Sinal de leitura consistente. Não é garantia de acerto." },
    { kind: "media", text: "Sinal intermediário. Vale conferir." },
    { kind: "baixa", text: "Sinal fraco. Confira com a ficha." },
    {
        kind: "sem_mencao",
        text: "O modelo não achou o termo no texto. Ausência de sinal, não prova de acerto.",
    },
    {
        kind: "sem_avaliacao",
        text: "Campo sem faixa de confiança (regra de texto, valor padrão ou campo em branco). Não quer dizer que esteja certo nem errado.",
    },
];