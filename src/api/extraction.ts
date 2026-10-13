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
    quality?: QualityBlock;
  };
}

// Faixa de confiança (dado de negócio). O backend só emite estes três valores;
// qualquer outro (ou `null`) é tratado como "sem avaliação" na tela.
export type ConfidenceBand = "alta" | "media" | "baixa";

// `sinais` cresce com as versões do backend: só as chaves usadas pela tela são
// tipadas, o resto é tolerado e ignorado.
export interface FieldSignals {
  // GLiNER: "ausencia" (silêncio do modelo), "span" ou "misto".
  tipo_evidencia?: string;
  // Por que o campo não tem faixa (faixa null).
  motivo_sem_faixa?: string;
  votos_contrarios?: number;
  [key: string]: unknown;
}

// `confianca`, `faixa` e `sinais` só existem a partir da versão de confiança
// 1.x do backend e são opcionais de propósito: resposta antiga, registro salvo
// ou `paginas: []` não podem quebrar a tela. `confianca` é um índice NÃO
// calibrado: nunca exibir como percentual.
export interface FieldSource {
  paginas: number[];
  fonte: string;
  confianca?: number | null;
  faixa?: ConfidenceBand | null;
  sinais?: FieldSignals | null;
}

export interface QualityReason {
  criterio: string;
  fracao: number;
  limite: number;
}

export interface QualityPages {
  total?: number | null;
  total_pdf?: number | null;
  identificadas?: number | null;
  ignoradas?: number | null;
  unresolved?: number | null;
  nao_identificadas?: number[] | null;
  nao_identificadas_com_texto?: number | null;
  [key: string]: unknown;
}

export interface QualityBlock {
  confidence_version?: string;
  faixa_documento?: ConfidenceBand | null;
  faixa_documento_motivos?: QualityReason[] | null;
  paginas?: QualityPages | null;
  // Ordenada por risco (a ordem importa). Pode ter até 20 chaves.
  campos_para_revisar?: string[] | null;
  [key: string]: unknown;
}

export interface StructuredExtractionResult {
  structuredData: Record<string, unknown>;
  fieldSources: Record<string, FieldSource>;
  // Ausente em registros salvos e em respostas de backends sem o bloco.
  quality?: QualityBlock | null;
}

export async function startExtraction(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post("/api/extractions", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function getStatus(jobId: string) {
  const response = await api.get(`/api/extractions/${jobId}/status`);
  return response.data;
}

export async function getResult(jobId: string) {
  const response = await api.get(`/api/extractions/${jobId}/result`);
  return response.data;
}

export async function getStructuredResult(jobId: string) {
  const response = await api.post(`/api/extractions/${jobId}/structured`);
  const data = (response.data as StructuredExtractionResponse)?.data;

  if (!data?.structured_data) return null;

  return {
    structuredData: data.structured_data,
    fieldSources: data.field_sources ?? {},
    quality: data.quality ?? null,
  } satisfies StructuredExtractionResult;
}