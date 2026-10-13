import type { EditableField as EditableFieldType } from "../types/editableLabel";
import { useEffect, useMemo, useState } from "react";
import EditableField from "./EditableField";
import { flattenObject } from "../utils/flattenJson";
import { getFieldLabel } from "../data/fieldLabels";
import { normalizeFieldKey } from "../data/fieldDescriptions";
import axios from "axios";
import { createStructuredData, updateStructuredData } from "../api/structuredData";
import type { StructuredExtractionResult } from "../api/extraction";
import { describeFieldConfidence } from "../data/confidence";
import QualityPanel from "./QualityPanel";
import { Link } from "react-router-dom";

interface ResultModalProps {
    open: boolean;
    // `quality` e a confiança por campo são opcionais: registros salvos e
    // backends sem o bloco abrem normalmente, só que sem selos nem painel.
    result: StructuredExtractionResult | null;
    // Preenchido quando o modal abre um registro JÁ SALVO (lista "Extrações
    // salvas"): salvar passa a ser um update desse registro (com o dono dele,
    // para admin) e a predição usa o mesmo dnv/dono. Null para um resultado
    // recém-extraído, que ainda não foi salvo.
    savedRecord?: { dnv: string; ownerId: string | null } | null;
    onClose: () => void;
    onSaved?: () => Promise<void> | void;
}

export default function ResultModal({
    open,
    onClose,
    result,
    savedRecord,
    onSaved,
}: ResultModalProps) {
    const [fields, setFields] = useState<EditableFieldType[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [search, setSearch] = useState("");
    // Foco da fila "conferir primeiro": chaves exatas (null = lista completa).
    const [focusKeys, setFocusKeys] = useState<string[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    // Registro salvo por este modal: alimenta o atalho para a tela de
    // predição (a predição em si agora vive em /predicao, não aqui).
    const [savedTarget, setSavedTarget] = useState<{
        dnv: string;
        ownerId: string | null;
    } | null>(null);
    // dnv criado por este modal (POST /create) -- dali em diante, salvar de
    // novo é um update, não uma nova criação (que daria 409).
    const [createdDnv, setCreatedDnv] = useState<string | null>(null);

    function buildStructuredDataFromFields(editableFields: EditableFieldType[]) {
        const structuredData: Record<string, unknown> = {};

        for (const field of editableFields) {
            const keys = field.path.split(".").filter(Boolean);

            if (keys.length === 0) continue;

            let current: Record<string, unknown> = structuredData;

            for (let index = 0; index < keys.length - 1; index += 1) {
                const key = keys[index];
                const next = current[key];

                if (!next || typeof next !== "object" || Array.isArray(next)) {
                    current[key] = {};
                }

                current = current[key] as Record<string, unknown>;
            }

            current[keys[keys.length - 1]] = field.value;
        }

        return structuredData;
    }

    async function handleSave() {
        try {
            setSaveError(null);
            setSaveSuccess(null);

            const structuredData = buildStructuredDataFromFields(fields);
            const dnvValue = structuredData.dnv;

            if (typeof dnvValue !== "string" || dnvValue.trim().length === 0) {
                setSaveError("O campo dnv é obrigatório para salvar.");
                return;
            }

            structuredData.dnv = dnvValue.trim();

            // Registro que já existe no banco: update, nunca create (o
            // create responderia 409 e a edição se perderia).
            const existing =
                savedRecord ?? (createdDnv ? { dnv: createdDnv, ownerId: null } : null);

            if (existing && existing.dnv !== structuredData.dnv) {
                // O update é pelo dnv do registro salvo, e o backend não
                // renomeia o dnv: aceitar a edição deixaria a coluna `dnv`
                // diferente do dnv dentro dos dados.
                setSaveError("Não é possível alterar o DNV de um registro já salvo.");
                return;
            }

            setIsSaving(true);

            if (existing) {
                await updateStructuredData(
                    existing.dnv,
                    structuredData,
                    existing.ownerId ?? undefined
                );
            } else {
                try {
                    await createStructuredData(structuredData);
                    setCreatedDnv(structuredData.dnv as string);
                } catch (error) {
                    // Já existe um registro seu com esse dnv (ex.: salvo em
                    // outra sessão): atualiza em vez de recusar.
                    if (axios.isAxiosError(error) && error.response?.status === 409) {
                        await updateStructuredData(structuredData.dnv as string, structuredData);
                        setCreatedDnv(structuredData.dnv as string);
                    } else {
                        throw error;
                    }
                }
            }

            setSaveSuccess("Dados salvos com sucesso.");
            setSavedTarget({
                dnv: structuredData.dnv as string,
                ownerId: existing?.ownerId ?? null,
            });
            await onSaved?.();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;

                if (status === 409) {
                    setSaveError(
                        "Este DNV existe para mais de um usuário. Abra o registro pela lista de extrações salvas."
                    );
                    return;
                }

                if (status === 404) {
                    setSaveError("O registro salvo não foi encontrado.");
                    return;
                }

                if (status === 422) {
                    setSaveError("Payload inválido para persistência.");
                    return;
                }
            }

            setSaveError("Não foi possível salvar os dados estruturados.");
        } finally {
            setIsSaving(false);
        }
    }

    useEffect(() => {
        const extractedFields = flattenObject(result?.structuredData ?? null);

        setFields(extractedFields.map(field => ({
            ...field,
            sourcePages: result?.fieldSources[field.path]?.paginas,
            confidence: describeFieldConfidence(result?.fieldSources[field.path]),
        })));
        setCurrentPage(1);
        setFocusKeys(null);
        setSaveError(null);
        setSaveSuccess(null);
        setSavedTarget(null);
        setCreatedDnv(null);
    }, [result]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, focusKeys]);

    const filteredFields = useMemo(() => {

        // O foco da fila vem antes da busca; a busca ainda refina dentro dele.
        const base = focusKeys
            ? fields.filter(field => focusKeys.includes(field.path))
            : fields;

        if (!search.trim()) {
            return base;
        }

        // Ignora acentos e maiúsculas: "gestacao" acha "Gestação múltipla".
        const query = normalizeFieldKey(search);

        return base.filter(field =>
            normalizeFieldKey(field.label).includes(query) ||
            normalizeFieldKey(getFieldLabel(field.path, field.label)).includes(query) ||
            normalizeFieldKey(field.path).includes(query)
        );

    }, [fields, search, focusKeys]);

    const totalPages = Math.max(1, Math.ceil(filteredFields.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const visibleFields = filteredFields.slice(startIndex, startIndex + itemsPerPage);

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

                        <h2 className="font-display text-2xl font-bold text-ink">
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

                    <QualityPanel
                        structuredData={result.structuredData}
                        fieldSources={result.fieldSources}
                        quality={result.quality}
                        focusKeys={focusKeys}
                        onFocus={setFocusKeys}
                    />

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
                                focus:border-maroon
                            "
                            placeholder="Pesquisar campo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                    <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                        <p>
                            Mostrando {filteredFields.length === 0 ? 0 : startIndex + 1}
                            -{Math.min(startIndex + itemsPerPage, filteredFields.length)}
                            de {filteredFields.length}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                className="rounded-full border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                                disabled={safeCurrentPage === 1}
                            >
                                Anterior
                            </button>

                            <span>
                                Página {safeCurrentPage} de {totalPages}
                            </span>

                            <button
                                className="rounded-full border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
                                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                                disabled={safeCurrentPage === totalPages}
                            >
                                Próxima
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">

                        {visibleFields.map((field) => (

                            <EditableField
                                key={field.path}
                                field={field}
                                onChange={(value) => {

                                    setFields(previous => {

                                        return previous.map(item =>
                                            item.path === field.path
                                                ? { ...item, value }
                                                : item
                                        );
                                    });

                                }}
                            />

                        ))}

                    </div>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-4 border-t p-6">

                    {saveError && (
                        <p className="mr-auto self-center text-sm text-red-600">{saveError}</p>
                    )}

                    {saveSuccess && (
                        <p className="mr-auto self-center text-sm text-green-700">
                            {saveSuccess}
                            {savedTarget && (
                                <>
                                    {" "}
                                    <Link
                                        to={`/predicao?${new URLSearchParams({
                                            dnv: savedTarget.dnv,
                                            ...(savedTarget.ownerId
                                                ? { owner: savedTarget.ownerId }
                                                : {}),
                                        }).toString()}`}
                                        className="font-semibold text-maroon underline"
                                    >
                                        Calcular predição →
                                    </Link>
                                </>
                            )}
                        </p>
                    )}

                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-full border px-6 py-2"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-full bg-espresso px-6 py-2 text-white"
                    >
                        {isSaving ? "Salvando..." : "Salvar alterações"}
                    </button>

                </div>

            </div>

        </div>
    );
}