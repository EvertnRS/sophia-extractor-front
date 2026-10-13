import { useEffect, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import {
    getStructuredResult,
    getStatus,
    startExtraction,
    type ExtractionStatusResponse,
} from "../api/extraction";
import {
    listStructuredData,
    type StructuredDataRecord,
} from "../api/structuredData";
import type { StructuredExtractionResult } from "../api/extraction";
import ProgressBar from "./ProgressBar";
import ResultModal from "./ResultModal";

export default function UploadCard() {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ExtractionStatusResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<StructuredExtractionResult | null>(null);
    const [savedExtractions, setSavedExtractions] = useState<StructuredDataRecord[]>([]);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);
    const [savedError, setSavedError] = useState<string | null>(null);

    const [openResult, setOpenResult] = useState(false);
    // Registro salvo aberto no modal (null para um resultado recém-extraído).
    const [resultSavedRecord, setResultSavedRecord] = useState<{
        dnv: string;
        ownerId: string | null;
    } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    async function loadSavedExtractions() {
        try {
            setSavedError(null);
            setIsLoadingSaved(true);

            const records = await listStructuredData();
            setSavedExtractions(records);
        } catch (err) {
            console.error(err);
            setSavedError("Nao foi possivel carregar as extracoes salvas.");
        } finally {
            setIsLoadingSaved(false);
        }
    }

    function openSavedExtraction(record: StructuredDataRecord) {
        setResult({
            structuredData: record.structured_data,
            fieldSources: {},
        });
        setResultSavedRecord({ dnv: record.dnv, ownerId: record.owner_id });
        setOpenResult(true);
    }

    useEffect(() => {
        const jobId = localStorage.getItem("currentJobId");

        if (!jobId) return;

        async function restoreJob() {
            try {
                if (!jobId) return;

                const status = await getStatus(jobId);
                setJob(status);
            } catch (err) {
                console.error(err);
                localStorage.removeItem("currentJobId");
            }
        }

        restoreJob();
    }, []);

    useEffect(() => {
        loadSavedExtractions();
    }, []);

    useEffect(() => {
        if (!job) {
            setIsPolling(false);
            return;
        }

        if (job.status === "completed" || job.status === "failed") {
            setIsPolling(false);
            localStorage.removeItem("currentJobId");
            return;
        }

        setIsPolling(true);

        const intervalId = window.setInterval(async () => {
            try {
                const updatedJob = await getStatus(job.job_id);

                setJob(updatedJob);

                if (
                    updatedJob.status === "completed" ||
                    updatedJob.status === "failed"
                ) {
                    window.clearInterval(intervalId);
                    setIsPolling(false);
                    localStorage.removeItem("currentJobId");
                }
            } catch (err) {
                console.error(err);
                setError("Não foi possível atualizar o status da extração.");
                window.clearInterval(intervalId);
                setIsPolling(false);
            }
        }, 8000);

        return () => window.clearInterval(intervalId);
    }, [job?.job_id, job?.status]);

    async function handleUpload() {
        if (!file) {
            setError("Selecione um arquivo PDF antes de iniciar a extração.");
            return;
        }

        try {
            setError(null);
            setIsSubmitting(true);

            const startedJob = await startExtraction(file);
            const status = await getStatus(startedJob.job_id);
            localStorage.setItem("currentJobId", status.job_id);
            setJob(status);
            setFile(null);

            if (status.status === "completed") {
                const extractionResult = await getStructuredResult(status.job_id);
                setResult(extractionResult);
                setResultSavedRecord(null);
                setOpenResult(true);
            }
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar a extração selecionada.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleOpenResult() {

        if (!job) return;

        try {

            console.log("Carregando resultado da extração para o job_id:", job.job_id);

            const extractionResult = await getStructuredResult(job.job_id);

            console.log("Resultado da extração:", extractionResult);

            setResult(extractionResult);
            setResultSavedRecord(null);

            setOpenResult(true);

        } catch (error) {

            console.error(error);

            setError("Não foi possível carregar o resultado.");

        }

    }

    function handleFile(file: File | null) {
        if (!file) return;

        if (file.type !== "application/pdf") {
            alert("Selecione um arquivo PDF.");
            return;
        }

        setFile(file);
    }

    function resetJob() {
        setJob(null);
        setError(null);
        localStorage.removeItem("currentJobId");
    }

    return (
        <section className="mt-10">

            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();

                    handleFile(e.dataTransfer.files[0]);
                }}
                className="
                    cursor-pointer
                    rounded-3xl
                    border-2
                    border-dashed
                    border-blush
                    bg-white
                    p-14
                    text-center
                    transition
                    hover:border-espresso
                "
            >

                <FileUp
                    size={56}
                    className="mx-auto text-ink"
                />

                <h2 className="mt-6 font-display text-2xl font-semibold text-ink">
                    Arraste um PDF aqui
                </h2>

                <p className="mt-2 text-gray-500">
                    ou clique para selecionar
                </p>

                <p className="mt-6 text-sm text-gray-400">
                    Formato aceito: PDF
                </p>

                {file && (
                    <div className="mt-8 rounded-xl bg-blush-soft p-4">
                        <p className="font-medium text-ink">
                            {file.name}
                        </p>
                    </div>
                )}

                {job && (
                    <div className="mt-8 text-left">
                        <p className="text-sm font-medium text-gray-500">
                            Arquivo em processamento
                        </p>

                        <p className="mt-1 text-lg font-semibold text-ink">
                            {job.filename}
                        </p>

                        <ProgressBar
                            progress={job.progress}
                            status={job.status}
                            message={job.message}
                            error={job.error}
                        />
                    </div>
                )}

                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                        handleFile(e.target.files?.[0] ?? null)
                    }
                />

            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                    disabled={isSubmitting || Boolean(job && isPolling)}
                    className="
                        rounded-full
                        bg-espresso
                        px-8
                        py-3
                        text-white
                        transition
                        hover:opacity-90
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                    "
                    onClick={handleUpload}
                >
                    {isSubmitting ? "Carregando..." : "Extrair"}
                </button>

                {job && (job.status === "completed" || job.status === "failed") && (
                    <button
                        className="rounded-full border border-blush px-8 py-3 text-ink transition hover:bg-blush-soft"
                        onClick={resetJob}
                    >
                        Nova extração
                    </button>
                )}

                {job?.status === "completed" && (
                    <button
                        onClick={handleOpenResult}
                        className="
                            rounded-full
                            bg-salmon
                            px-8
                            py-3
                            text-white
                            transition
                            hover:opacity-90
                        "
                    >
                        Visualizar resultado
                    </button>
                )}

                <ResultModal
                    open={openResult}
                    result={result}
                    savedRecord={resultSavedRecord}
                    onClose={() => setOpenResult(false)}
                    onSaved={loadSavedExtractions}
                />   

                {error && (
                    <p className="w-full text-center text-sm text-red-600">{error}</p>
                )}
            </div>

            <div className="mt-10 rounded-3xl border border-blush bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-xl font-semibold text-ink">
                        Extracoes salvas
                    </h3>

                    <button
                        onClick={loadSavedExtractions}
                        disabled={isLoadingSaved}
                        className="rounded-full border border-blush px-4 py-2 text-sm text-ink transition hover:bg-blush-soft disabled:opacity-40"
                    >
                        {isLoadingSaved ? "Atualizando..." : "Atualizar"}
                    </button>
                </div>

                {savedError && (
                    <p className="text-sm text-red-600">{savedError}</p>
                )}

                {!savedError && savedExtractions.length === 0 && !isLoadingSaved && (
                    <p className="text-sm text-gray-500">Nenhuma extracao salva encontrada.</p>
                )}

                {savedExtractions.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {savedExtractions.map((record) => (
                            <button
                                key={`${record.dnv}-${record.updated_at}`}
                                onClick={() => openSavedExtraction(record)}
                                className="rounded-2xl border border-blush bg-cream p-4 text-left transition hover:border-espresso"
                            >
                                <p className="text-sm text-gray-500">DNV</p>
                                <p className="mt-1 text-lg font-semibold text-ink">{record.dnv}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </section>
        
    );
    
}