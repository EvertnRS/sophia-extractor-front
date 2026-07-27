import type { EditableField as EditableFieldType } from "../types/editableLabel";
import { useEffect, useMemo, useState } from "react";
import EditableField from "./EditableField";
import { flattenObject } from "../utils/flattenJson";

interface ResultModalProps {
    open: boolean;
    result: Record<string, unknown> | null;
    onClose: () => void;
}

export default function ResultModal({
    open,
    onClose,
    result,
}: ResultModalProps) {
    const [fields, setFields] = useState<EditableFieldType[]>([]);
    const [visibleCount, setVisibleCount] = useState(60);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setFields(flattenObject(result));
        setVisibleCount(60);
    }, [result]);

    const filteredFields = useMemo(() => {

        if (!search.trim()) {
            return fields;
        }

        const query = search.toLowerCase();

        return fields.filter(field =>
            field.label.toLowerCase().includes(query) ||
            field.path.toLowerCase().includes(query)
        );

    }, [fields, search]);

    const visibleFields = filteredFields.slice(0, visibleCount);

    if (!open) return null;

    if (!result) {

        return (
            <div className="fixed inset-0 ...">

                <div className="rounded-3xl bg-white p-12">

                    Carregando resultado...

                </div>

            </div>
        );

    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

            <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-3xl bg-white shadow-2xl">


                <div className="flex items-center justify-between border-b px-8 py-6">

                    <div>

                        <h2 className="text-2xl font-bold text-[#4A3534]">
                            Resultado da Extração
                        </h2>

                        <p className="mt-1 text-gray-500">
                            Revise os campos antes de salvar.
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="text-3xl text-gray-400 hover:text-gray-700"
                    >
                        ×
                    </button>

                </div>

                {/* Conteúdo */}

                <div className="flex-1 overflow-y-auto p-8">

                    <div className="mb-6">

                        <input
                            className="
                                w-full
                                rounded-xl
                                border
                                border-gray-300
                                px-4
                                py-3
                                outline-none
                                focus:border-[#B67B73]
                            "
                            placeholder="Pesquisar campo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                    <div className="space-y-1">

                        {visibleFields.map((field, index) => (

                            <EditableField
                                key={field.path}
                                field={field}
                                onChange={(value) => {

                                    setFields(previous => {

                                        const copy = [...previous];

                                        copy[index] = {
                                            ...copy[index],
                                            value,
                                        };

                                        return copy;
                                    });

                                }}
                            />

                        ))}

                    </div>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-4 border-t p-6">

                    <button
                        onClick={onClose}
                        className="rounded-full border px-6 py-2"
                    >
                        Cancelar
                    </button>

                    <button
                        className="rounded-full bg-[#4A3534] px-6 py-2 text-white"
                    >
                        Salvar alterações
                    </button>

                </div>

            </div>

        </div>
    );
}