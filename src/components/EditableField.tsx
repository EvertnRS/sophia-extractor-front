import type { EditableField } from "../types/editableLabel";

interface Props {
    field: EditableField;
    onChange: (value: string) => void;
}

export default function EditableField({
    field,
    onChange,
}: Props) {

    return (
        <div className="grid grid-cols-[280px_1fr] gap-6 border-b py-4">

            <div>

                <p className="font-medium text-[#4A3534]">
                    {field.label}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                    {field.path}
                </p>

            </div>

            <input
                className="
                    rounded-xl
                    border
                    border-gray-200
                    px-4
                    py-2
                    outline-none
                    focus:border-[#B67B73]
                "
                value={field.value}
                onChange={(e) => onChange(e.target.value)}
            />

        </div>
    );
}