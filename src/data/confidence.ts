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
    if (!("faixa" in source)) return null;

    const tipo = source.sinais?.tipo_evidencia;
    const index = formatIndex(source.confianca);
    const indexLine = index ? `Índice ${index} (não calibrado).` : null;

    if (!isBand(source.faixa)) {
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
    if (indexLine) lines.push(indexLine);

    return {
        kind: source.faixa,
        label: BADGE_LABELS[source.faixa],
        tooltip: lines,
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
        text: "O sistema ainda não avalia este campo. Não quer dizer que esteja certo nem errado.",
    },
];