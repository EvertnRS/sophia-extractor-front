import axios from "axios";

const crudApi = axios.create({
    baseURL: "http://localhost:8000",
});

export interface StructuredDataRecord {
    dnv: string;
    structured_data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

type StructuredDataPayload = Record<string, unknown>;

export async function createStructuredData(structuredData: StructuredDataPayload) {
    const response = await crudApi.post("/create", {
        structured_data: structuredData,
    });

    return response.data;
}

export async function listStructuredData() {
    const response = await crudApi.get("/");
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

export async function updateStructuredData(dnv: string, structuredData: StructuredDataPayload) {
    const response = await crudApi.put(`/update/${dnv}`, {
        structured_data: structuredData,
    });

    return response.data;
}

export async function getStructuredDataByDnv(dnv: string) {
    const response = await crudApi.get<StructuredDataRecord>(`/${dnv}`);

    return response.data;
}

export async function deleteStructuredDataByDnv(dnv: string) {
    const response = await crudApi.delete(`/delete/${dnv}`);

    return response.data as { message: string };
}
