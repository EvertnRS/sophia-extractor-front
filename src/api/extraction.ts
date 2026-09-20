import { api } from "./api";

export interface ExtractionStatusResponse {
  job_id: string;
  filename: string;
  status: string;
  progress: number;
  message: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface StructuredExtractionResponse {
  job_id: string;
  status: string;
  data: {
    filename: string;
    structured_data: Record<string, unknown>;
    field_sources?: Record<string, FieldSource>;
  };
}

export interface FieldSource {
  paginas: number[];
  fonte: string;
}

export interface StructuredExtractionResult {
  structuredData: Record<string, unknown>;
  fieldSources: Record<string, FieldSource>;
}

export async function startExtraction(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post("/extractions", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getStatus(jobId: string) {
  const response = await api.get(`/extractions/${jobId}/status`);
  return response.data;
}

export async function getResult(jobId: string) {
  const response = await api.get(`/extractions/${jobId}/result`);
  return response.data;
}

export async function getStructuredResult(jobId: string) {
  const response = await api.post(`/extractions/${jobId}/structured`);
  const data = (response.data as StructuredExtractionResponse)?.data;

  if (!data?.structured_data) return null;

  return {
    structuredData: data.structured_data,
    fieldSources: data.field_sources ?? {},
  } satisfies StructuredExtractionResult;
}