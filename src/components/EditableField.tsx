import type { EditableField } from "../types/editableLabel";
import { getFieldDescription } from "../data/fieldDescriptions";
import { getFieldLabel } from "../data/fieldLabels";
import ConfidenceBadge from "./Confidencebadge";

interface Props {
    field: EditableField;
    onChange: (value: string) => void;
}

export default function EditableField({
    field,
    onChange,
}: Props) {
    const description = getFieldDescription(field.path);
    const displayLabel = getFieldLabel(field.path, field.label);

    return (
        <div className="grid grid-cols-[280px_1fr] gap-6 border-b py-4">

            <div>

                <div className="flex items-center gap-1.5">

                    <p className="font-medium text-ink">
                        {displayLabel}
                    </p>

                    {description && (
                        <div className="group/tooltip relative inline-flex">

                            <button
                                type="button"
                                className="
                                    flex
                                    h-4
                                    w-4
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-gray-300
                                    text-[10px]
                                    font-semibold
                                    leading-none
                                    text-gray-400
                                    outline-none
                                    transition-colors
                                    hover:border-maroon
                                    hover:text-maroon
                                    focus-visible:border-maroon
                                    focus-visible:text-maroon
                                "
                                aria-label={`Como o campo "${displayLabel}" é preenchido`}
                            >
                                ?
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
                                <div
                                    className="
                                        absolute
                                        left-2
                                        bottom-full
                                        border-4
                                        border-transparent
                                        border-b-ink
                                    "
                                />

                                {description}
                            </div>

                        </div>
                    )}

                </div>

                <p className="mt-1 text-xs text-gray-400">
                    {field.path}
                </p>

                {field.confidence && (
                    <div className="mt-1.5">
                        <ConfidenceBadge confidence={field.confidence} />
                    </div>
                )}

            </div>

            <input
                className="
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-2
                    outline-none
                    focus:border-maroon
                "
                value={field.value}
                onChange={(e) => onChange(e.target.value)}
            />

            {field.sourcePages && field.sourcePages.length > 0 && (
                <p className="col-start-2 text-xs text-gray-400">
                    Páginas: {field.sourcePages.join(", ")}
                </p>
            )}

        </div>
    );
}