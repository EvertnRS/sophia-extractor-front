import axios from "axios";
import { api } from "./api";

/**
 * Contract for GET/POST /api/reports/{dnv}.
 *
 * The backend should generate the report from the saved, reviewed data for
 * this record. `report_text` is intentionally plain text so the frontend
 * does not render model output as HTML.
 */
export interface LlmReport {
    dnv: string;
    owner_id: string | null;
    report_text: string;
    model_name: string;
    model_version: string | null;
    is_stale: boolean;
    created_at: string | null;
}

export class LlmReportError extends Error {}

function toReportError(error: unknown): LlmReportError {
    if (!axios.isAxiosError(error)) {
        return new LlmReportError("Não foi possível gerar o relatório.");
    }

    switch (error.response?.status) {
        case 404:
            return new LlmReportError(
                "Salve os dados revisados antes de gerar o relatório."
            );
        case 409:
            return new LlmReportError(
                "Este DNV tem registros de mais de um usuário. Abra o registro pela lista de extrações salvas para escolher qual."
            );
        default:
            return new LlmReportError(
                "O serviço de relatório está indisponível. Tente novamente mais tarde."
            );
    }
}

function reportUrl(dnv: string) {
    return `/api/reports/${encodeURIComponent(dnv)}`;
}

export async function getLlmReport(
    dnv: string,
    ownerId?: string | null
): Promise<LlmReport | null> {
    try {
        const response = await api.get<LlmReport>(reportUrl(dnv), {
            params: ownerId ? { owner_id: ownerId } : undefined,
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw toReportError(error);
    }
}

export async function generateLlmReport(
    dnv: string,
    ownerId?: string | null
): Promise<LlmReport> {
    try {
        const response = await api.post<LlmReport>(reportUrl(dnv), null, {
            params: ownerId ? { owner_id: ownerId } : undefined,
        });
        return response.data;
    } catch (error) {
        throw toReportError(error);
    }
}
