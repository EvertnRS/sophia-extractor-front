import { useEffect, useRef, useState } from "react";
import { FileUp } from "lucide-react";
import {
    getStructuredResult,
    getStatus,
    startExtraction,
    type ExtractionStatusResponse,
} from "../api/extraction";
import ProgressBar from "./ProgressBar";
import ResultModal from "./ResultModal";

export default function UploadCard() {
    const [file, setFile] = useState<File | null>(null);
    const [job, setJob] = useState<ExtractionStatusResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<Record<string, unknown> | null>(null);

    const [openResult, setOpenResult] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

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
        if (!file) return;

        try {
            setError(null);
            setIsSubmitting(true);

            const { job_id } = await startExtraction(file);
            console.log("Extração iniciada com job_id:", job_id);
            localStorage.setItem("currentJobId", job_id);

            const status = await getStatus(job_id);
            setJob(status);
            setFile(null);
        } catch (err) {
            console.error(err);
            setError("Não foi possível iniciar a extração.");
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
                    border-[#E8C8C5]
                    bg-white
                    p-14
                    text-center
                    transition
                    hover:border-[#B67B73]
                "
            >

                <FileUp
                    size={56}
                    className="mx-auto text-[#4A3534]"
                />

                <h2 className="mt-6 text-2xl font-semibold text-[#4A3534]">
                    Arraste um PDF aqui
                </h2>

                <p className="mt-2 text-gray-500">
                    ou clique para selecionar
                </p>

                <p className="mt-6 text-sm text-gray-400">
                    Formato aceito: PDF
                </p>

                {file && (
                    <div className="mt-8 rounded-xl bg-[#F8F3F2] p-4">
                        <p className="font-medium text-[#4A3534]">
                            {file.name}
                        </p>
                    </div>
                )}

                {job && (
                    <div className="mt-8 text-left">
                        <p className="text-sm font-medium text-gray-500">
                            Arquivo em processamento
                        </p>

                        <p className="mt-1 text-lg font-semibold text-[#4A3534]">
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
                    disabled={!file || isSubmitting || Boolean(job && isPolling)}
                    className="
                        rounded-full
                        bg-[#4A3534]
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
                    {isSubmitting ? "Iniciando..." : "Iniciar extração"}
                </button>

                {job && (job.status === "completed" || job.status === "failed") && (
                    <button
                        className="rounded-full border border-[#E8C8C5] px-8 py-3 text-[#4A3534] transition hover:bg-[#F8F3F2]"
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
                            bg-[#EFA39C]
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
                    onClose={() => setOpenResult(false)}
                    
                />   

                {error && (
                    <p className="w-full text-center text-sm text-red-600">{error}</p>
                )}
            </div>

        </section>
        
    );
    
}