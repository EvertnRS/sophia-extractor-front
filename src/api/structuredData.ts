import { api } from "./api";

export interface StructuredDataRecord {
    dnv: string;
    // Presente desde a issue de isolamento por usuário: quem criou o
    // registro. Legado sem dono (raro, só se existir dado anterior à
    // feature) vem como null.
    owner_id: string | null;
    structured_data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

type StructuredDataPayload = Record<string, unknown>;

export async function createStructuredData(structuredData: StructuredDataPayload) {
    const response = await api.post("/create", {
        structured_data: structuredData,
    });

    return response.data;
}

export async function listStructuredData() {
    const response = await api.get("/");
    const payload = response.data;

    if (Array.isArray(payload)) {
        return payload as StructuredDataRecord[];
    }

    if (Array.isArray((payload as { data?: unknown[] })?.data)) {
        return (payload as { data: StructuredDataRecord[] }).data;
    }

    if (Array.isArray((payload as { structured_data?: unknown[] })?.structured_data)) {
        return (payload as { structured_data: StructuredDataRecord[] }).structured_data;
    }

    return [] as StructuredDataRecord[];
}

export async function updateStructuredData(
    dnv: string,
    structuredData: StructuredDataPayload,
    // Só relevante para admin, quando o mesmo dnv pertence a mais de um
    // usuário -- ver `?owner_id=` em PUT /update/{dnv} no backend. Um
    // usuário comum sempre edita o próprio registro, sem precisar disso.
    ownerId?: string
) {
    const response = await api.put(`/update/${dnv}`, {
        structured_data: structuredData,
    }, {
        params: ownerId ? { owner_id: ownerId } : undefined,
    });

    return response.data;
}

/**
 * GET /{dnv}: para usuário comum, no máximo um registro (o dele, se
 * existir). Para admin, pode vir mais de um se o dnv for compartilhado
 * por usuários diferentes -- por isso o retorno é sempre um array aqui
 * (normaliza o objeto único que o backend devolve nesse caso em uma
 * lista de 1 item, pra quem consome não precisar checar os dois formatos).
 */
export async function getStructuredDataByDnv(dnv: string) {
    const response = await api.get<StructuredDataRecord | StructuredDataRecord[]>(
        `/${dnv}`
    );

    return Array.isArray(response.data) ? response.data : [response.data];
}

export async function deleteStructuredDataByDnv(dnv: string, ownerId?: string) {
    const response = await api.delete(`/delete/${dnv}`, {
        params: ownerId ? { owner_id: ownerId } : undefined,
    });

    return response.data as { message: string };
}