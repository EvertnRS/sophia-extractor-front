import { BADGE_CLASSES, type FieldConfidence } from "../data/confidence";

interface Props {
    confidence: FieldConfidence | null | undefined;
}

/**
 * Selo de confiança de um campo. O texto da faixa é sempre escrito (a cor
 * sozinha não carrega o significado). O índice numérico, quando existe, vive
 * só no tooltip -- ver `describeFieldConfidence`.
 */
export default function ConfidenceBadge({ confidence }: Props) {
    if (!confidence) return null;

    return (
        <div className="group/tooltip relative inline-flex">
            <button
                type="button"
                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-tight outline-none focus-visible:ring-2 focus-visible:ring-maroon ${BADGE_CLASSES[confidence.kind]}`}
                aria-label={`Confiança: ${confidence.label}. ${confidence.tooltip.join(" ")}`}
            >
                {confidence.label}
            </button>

            <div
                role="tooltip"
                className="
                    pointer-events-none
                    invisible
                    absolute
                    top-full
                    left-0
                    z-20
                    mt-2
                    w-64
                    rounded-xl
                    bg-ink
                    px-3
                    py-2
                    text-xs
                    leading-snug
                    text-white
                    opacity-0
                    shadow-lg
                    transition-opacity
                    duration-150
                    group-hover/tooltip:visible
                    group-hover/tooltip:opacity-100
                    group-focus-within/tooltip:visible
                    group-focus-within/tooltip:opacity-100
                "
            >
                {confidence.tooltip.map((line, index) => (
                    <p key={index} className={index > 0 ? "mt-1" : undefined}>
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
}