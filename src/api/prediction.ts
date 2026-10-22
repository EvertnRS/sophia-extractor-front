import axios from "axios";
import { api } from "./api";

/**
 * Contrato de GET/POST /api/predictions/{dnv}.
 *
 * A predição pertence ao REGISTRO CURADO (o dado salvo no modal, identificado
 * por dnv + dono), não à extração: funciona para qualquer registro salvo,
 * inclusive os da lista "Extrações salvas".
 *
 * `predicted_class` e `predicted_probability` só vêm quando
 * `status === "success"`. Uma predição com `status === "error"` (execução
 * que falhou e nunca teve sucesso antes) vem sem eles.
 *
 * `status === "insufficient_data"`: faltam variáveis centrais demais e o
 * modelo nem foi chamado. Também vem sem probabilidade e sem classe; traz só
 * `core_features_missing`.
 *
 * `predicted_probability` é a probabilidade AJUSTADA à prevalência-alvo
 * (`calibration.prior`), não a saída bruta do modelo. A classe sai da bruta
 * (>= 0,5). Backend antigo não manda `calibration`.
 */
export interface Prediction {
  dnv: string;
  owner_id: string | null;
  model_name: string;
  model_version: string | null;
  preprocessing_version: string;
  status: "success" | "error" | "insufficient_data";
  predicted_class?: 0 | 1;
  predicted_probability?: number;
  /** Faixa de risco sobre a probabilidade ajustada. A tela atual não a exibe. */
  risk_band?: "baixo" | "moderado" | "alto";
  /**
   * Ajuste de prevalência: π (`prior`), cortes das faixas e `provisional`
   * (true até π ser medida no CISAM). Backend antigo não manda.
   */
  calibration?: {
    method?: string | null;
    prior: number | null;
    band_cutoffs?: [number, number];
    provisional: boolean;
  } | null;
  /** Variáveis centrais ausentes (preenchido em `insufficient_data`). */
  core_features_missing?: string[] | null;
  /** Completude das variáveis centrais: ok, incompleto ou insuficiente. */
  data_quality?: "ok" | "incompleto" | "insuficiente" | null;
  /** Só no POST com `insufficient_data`: a predição anterior foi mantida. */
  previous_prediction_preserved?: boolean;
  features_filled: number | null;
  features_total: number | null;
  missing_features: string[] | null;
  disclaimer: string;
  /** O dado salvo foi alterado depois deste cálculo. */
  is_stale: boolean;
  created_at: string | null;
}

/** Erro de predição com mensagem já pronta para mostrar ao usuário. */
export class PredictionError extends Error {}

function toPredictionError(error: unknown): PredictionError {
  if (!axios.isAxiosError(error)) {
    return new PredictionError("Não foi possível calcular a predição.");
  }

  switch (error.response?.status) {
    case 404:
      // O backend usa SEMPRE o dado curado (salvo), nunca o bruto do PDF.
      return new PredictionError(
        "Salve os dados revisados antes de calcular a predição."
      );
    case 409:
      // Só admin: o mesmo DNV existe para mais de um usuário.
      return new PredictionError(
        "Este DNV tem registros de mais de um usuário. Abra o registro pela lista de extrações salvas para escolher qual."
      );
    default:
      return new PredictionError(
        "O serviço de predição está indisponível. Tente novamente mais tarde."
      );
  }
}

function predictionUrl(dnv: string) {
  return `/api/predictions/${encodeURIComponent(dnv)}`;
}

/** Calcula (ou recalcula) a predição. Sobrescreve a anterior no backend. */
export async function runPrediction(
  dnv: string,
  // Só admin, para desempatar quando o mesmo DNV tem dado de mais de um dono.
  ownerId?: string | null
): Promise<Prediction> {
  try {
    const response = await api.post<Prediction>(predictionUrl(dnv), null, {
      params: ownerId ? { owner_id: ownerId } : undefined,
    });
    return response.data;
  } catch (error) {
    throw toPredictionError(error);
  }
}

/**
 * Última predição salva, ou `null` se não há (o registro nunca foi salvo ou
 * a predição nunca foi calculada -- para quem consulta dá no mesmo).
 */
export async function getPrediction(
  dnv: string,
  ownerId?: string | null
): Promise<Prediction | null> {
  try {
    const response = await api.get<Prediction>(predictionUrl(dnv), {
      params: ownerId ? { owner_id: ownerId } : undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw toPredictionError(error);
  }
}