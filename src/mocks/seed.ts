import type { FieldSource, QualityBlock } from "../api/extraction";
import type { Prediction } from "../api/prediction";

/*
 * Dados SINTÉTICOS do modo mock. Nada aqui vem de pacientes reais: os valores
 * foram inventados só para as telas terem o que mostrar.
 */

// ---------------------------------------------------------------------------
// Tipos do "banco de dados" falso
// ---------------------------------------------------------------------------

export interface MockUser {
    id: string;
    email: string;
    password: string;
    role: "admin" | "user";
    is_active: boolean;
}

export interface MockRecord {
    dnv: string;
    owner_id: string | null;
    structured_data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface MockPrediction extends Prediction {
    // `updated_at` do registro no momento do cálculo; se mudar, a predição
    // passa a ser "desatualizada" (is_stale).
    source_updated_at: string;
}

export interface MockJob {
    job_id: string;
    filename: string;
    created_at: string;
    structured_data: Record<string, unknown>;
    field_sources: Record<string, FieldSource>;
    quality: QualityBlock;
}

export interface MockDb {
    users: MockUser[];
    records: MockRecord[];
    predictions: MockPrediction[];
    jobs: MockJob[];
    counters: { dnv: number };
}

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

export const ADMIN_ID = "mock-admin-0001";
export const USER_ID = "mock-user-0001";

export const seedUsers: MockUser[] = [
    {
        id: ADMIN_ID,
        email: "admin@sophia.test",
        password: "admin123",
        role: "admin",
        is_active: true,
    },
    {
        id: USER_ID,
        email: "user@sophia.test",
        password: "user123",
        role: "user",
        is_active: true,
    },
    {
        id: "mock-user-0002",
        email: "inativo@sophia.test",
        password: "inativo123",
        role: "user",
        is_active: false,
    },
];

// ---------------------------------------------------------------------------
// Campos extraídos (todos os campos conhecidos em data/fieldLabels.ts)
// ---------------------------------------------------------------------------

const baseFields: Record<string, string> = {
    dnv: "",
    tp_parto: "Cesárea",
    apgar_1min: "7",
    apgar_5min: "9",
    idade_semanal_gestacional: "32",
    raca_cor_materna: "Parda",
    idade_materna: "27",
    gestacao_multipla: "Não",
    sexo: "Feminino",
    drogas_gest: "Não",
    fumante: "Não",
    freq_bebida: "Não",
    has_materna: "Não",
    qt_consultas: "6",
    tempo_escolaridade: "Ensino médio completo",
    tp_clampeamento_cordao: "Tardio",
    bolsa_rota: "Não",
    sulfato_magnesio: "Sim",
    esteroide_anteneonatal: "Sim",
    trat_sifilis_conge: "Não",
    vl_perimetro_cefalico: "29",
    ventilacao_mascara_balao: "Não",
    droga_reanimacao: "Não",
    uso_o2: "Não",
    massagem_cardiaca: "Não",
    ventilacao_ventilador_manual_peca_t: "Não",
    ventilacao_canula_traqueal: "Não",
    reanimacao_neonatal: "Não",
    cpap_nasal_sala_parto: "Sim",
    o2_pos_reanimacao: "Não",
    md_evitar_hipotermia: "Sim",
    usou_saco_plastico_hipotermia: "Sim",
    usou_touca_hipotermia: "Sim",
    usou_colchao_termico_hipotermia: "Sim",
    temp_medida_admissao: "Sim",
    temp_admissao: "36.5",
    vent_mecanica: "Não",
    cpap_nasal: "Sim",
    cpap_nasal_sem_vent_mecanica: "Sim",
    vent_mecanica_dias: "0",
    vent_mecanica_36_semanas: "Não",
    o2_dia_28: "Não",
    o2_36_semanas: "Não",
    tempo_o2_dias: "3",
    sdr: "Não",
    ttrn: "Sim",
    hipertensao_pulmonar: "Não",
    hemorragia_pulmonar: "Não",
    pneumonia_adquirida: "Não",
    pneumonia_congenita: "Não",
    pneumonia_vent_mecanica: "Não",
    pneumotorax_vent_mecanica: "Não",
    anomalias_pulmonares: "Não",
    extubacao_acidental: "Não",
    convulsao_dia_3: "Não",
    hr_vida_primeira_dose_surfactante: "",
    surfactante: "Não",
    epicutaneo: "Sim",
    tempo_epicutaneo: "8",
    cateter_umbilical_venoso: "Sim",
    tempo_cateter_umbilical_venoso: "5",
    cateter_umbilical_arterial: "Não",
    tempo_cateter_umbilical_arterial: "",
    disseccao_venosa: "Não",
    tempo_disseccao_venosa: "",
    parenteral_plena: "Sim",
    tempo_parenteral: "6",
    uso_soro_aminoacido: "Sim",
    drogas_vasoativas: "Não",
    enteral: "Sim",
    tp_primeira_enteral: "2",
    peso: "1650",
    sepse: "Não",
    infeccao_precoce: "Não",
    infeccao_tardia: "Não",
    antibiotico_sepse: "Não",
    hemocultura_precoce: "Não",
    hemocultura_tardia: "Não",
    infeccao_cateter: "Não",
    ecn: "Não",
    cirurgia_ecn: "Não",
    cirurgia_anomalia_congenita: "Não",
    anomalias_cardiacas: "Não",
    hemorragia_intracraniana: "Não",
    anomalia_sistema_nervoso_central: "Não",
    anomalia_gastrintestinais: "Não",
    anomalias_geniturinarias: "Não",
    anomalia_cromossomica: "Não",
    outros_desfechos_congenitos: "Não",
    qual_defeito_congenito: "",
    exame_rop: "Sim",
    grau_rop: "Sem ROP",
    cirurgia_rop: "Não",
    desfecho: "Alta hospitalar",
    metodo_canguru: "Sim",
    dias_vida_metodo_canguru: "9",
};

// Três "perfis" de recém-nascido, aplicados por cima do `baseFields`.
const profiles: Record<string, string>[] = [
    // 0 -- prematuro moderado, evolução tranquila
    {},
    // 1 -- prematuro extremo, evolução difícil
    {
        tp_parto: "Cesárea",
        apgar_1min: "4",
        apgar_5min: "7",
        idade_semanal_gestacional: "27",
        sexo: "Masculino",
        gestacao_multipla: "Sim",
        has_materna: "Sim",
        qt_consultas: "3",
        bolsa_rota: "Sim",
        vl_perimetro_cefalico: "24",
        ventilacao_mascara_balao: "Sim",
        uso_o2: "Sim",
        reanimacao_neonatal: "Sim",
        ventilacao_canula_traqueal: "Sim",
        o2_pos_reanimacao: "Sim",
        temp_admissao: "35.4",
        vent_mecanica: "Sim",
        cpap_nasal: "Sim",
        cpap_nasal_sem_vent_mecanica: "Não",
        vent_mecanica_dias: "12",
        o2_dia_28: "Sim",
        o2_36_semanas: "Sim",
        tempo_o2_dias: "41",
        sdr: "Sim",
        ttrn: "Não",
        surfactante: "Sim",
        hr_vida_primeira_dose_surfactante: "2",
        cateter_umbilical_arterial: "Sim",
        tempo_cateter_umbilical_arterial: "4",
        drogas_vasoativas: "Sim",
        tp_primeira_enteral: "4",
        peso: "920",
        sepse: "Sim",
        infeccao_tardia: "Sim",
        antibiotico_sepse: "Sim",
        hemocultura_tardia: "Sim",
        hemorragia_intracraniana: "Sim",
        exame_rop: "Sim",
        grau_rop: "Grau 2",
        dias_vida_metodo_canguru: "38",
        tempo_parenteral: "18",
    },
    // 2 -- prematuro tardio
    {
        tp_parto: "Normal",
        apgar_1min: "8",
        apgar_5min: "9",
        idade_semanal_gestacional: "36",
        sexo: "Masculino",
        qt_consultas: "8",
        tempo_escolaridade: "Ensino superior completo",
        cpap_nasal_sala_parto: "Não",
        cpap_nasal: "Não",
        cpap_nasal_sem_vent_mecanica: "Não",
        tempo_o2_dias: "0",
        ttrn: "Não",
        epicutaneo: "Não",
        tempo_epicutaneo: "",
        cateter_umbilical_venoso: "Não",
        tempo_cateter_umbilical_venoso: "",
        parenteral_plena: "Não",
        tempo_parenteral: "",
        uso_soro_aminoacido: "Não",
        tp_primeira_enteral: "1",
        peso: "2450",
        vl_perimetro_cefalico: "32",
        temp_admissao: "36.8",
        exame_rop: "Não",
        grau_rop: "",
        metodo_canguru: "Não",
        dias_vida_metodo_canguru: "",
    },
];

export const PROFILE_COUNT = profiles.length;

export function buildStructuredData(
    profile: number,
    dnv: string,
    overrides: Record<string, string> = {}
): Record<string, unknown> {
    return {
        ...baseFields,
        ...profiles[profile % PROFILE_COUNT],
        ...overrides,
        dnv,
    };
}

// ---------------------------------------------------------------------------
// Confiança e qualidade (imitam o contrato de api/extraction.ts)
// ---------------------------------------------------------------------------

/** Número pseudoaleatório estável (0..1) a partir de um texto. */
function seeded(text: string): number {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return ((hash >>> 0) % 10000) / 10000;
}

// De qual "ficha" cada campo costuma vir (só para variar páginas e fonte).
function sourceFor(key: string): { fonte: string; pages: number[] } {
    const salaParto = [
        "raca_cor_materna", "idade_materna", "drogas_gest", "fumante", "freq_bebida",
        "has_materna", "qt_consultas", "tempo_escolaridade",
    ];
    const resumoAlta = ["desfecho", "exame_rop", "grau_rop", "cirurgia_rop", "metodo_canguru"];

    if (salaParto.includes(key)) return { fonte: "ficha_sala_parto", pages: [1, 2] };
    if (resumoAlta.includes(key)) return { fonte: "resumo_alta", pages: [21, 22] };
    return { fonte: "ficha_internacao", pages: [3, 4, 5] };
}

const MOTIVOS = ["circulo_nao_detectado", "texto_sem_score", "default_clinico"];

export function buildFieldSources(
    structuredData: Record<string, unknown>,
    seedKey: string
): Record<string, FieldSource> {
    const sources: Record<string, FieldSource> = {};

    for (const [key, value] of Object.entries(structuredData)) {
        if (key === "dnv") continue;

        const { fonte, pages } = sourceFor(key);
        const r = seeded(`${seedKey}:${key}`);
        const page = pages[Math.floor(seeded(`${key}:page`) * pages.length)];
        const empty = String(value ?? "").trim() === "";

        if (empty || value === "Não") {
            // Silêncio do modelo: vira o selo "Sem menção".
            sources[key] = {
                paginas: [],
                fonte: "gliner",
                confianca: 0.5,
                faixa: "media",
                sinais: { tipo_evidencia: "ausencia" },
            };
            continue;
        }

        if (r < 0.55) {
            sources[key] = {
                paginas: [page], fonte, confianca: Number((0.86 + r * 0.2).toFixed(2)),
                faixa: "alta", sinais: { tipo_evidencia: "span" },
            };
        } else if (r < 0.8) {
            sources[key] = {
                paginas: [page], fonte, confianca: Number((0.6 + (r - 0.55) * 0.9).toFixed(2)),
                faixa: "media", sinais: { tipo_evidencia: "misto", votos_contrarios: 1 },
            };
        } else if (r < 0.92) {
            sources[key] = {
                paginas: [page], fonte, confianca: Number((0.3 + (r - 0.8) * 2).toFixed(2)),
                faixa: "baixa", sinais: { tipo_evidencia: "span", votos_contrarios: 2 },
            };
        } else {
            sources[key] = {
                paginas: [page], fonte, confianca: null, faixa: null,
                sinais: { motivo_sem_faixa: MOTIVOS[Math.floor(r * 100) % MOTIVOS.length] },
            };
        }
    }

    return sources;
}

export function buildQuality(
    profile: number,
    fieldSources: Record<string, FieldSource>
): QualityBlock {
    const band = (["media", "baixa", "alta"] as const)[profile % PROFILE_COUNT];
    const totalPages = [48, 112, 31][profile % PROFILE_COUNT];
    const unidentified = [3, 14, 0][profile % PROFILE_COUNT];

    // Ordem de risco: faixa baixa primeiro, depois sem avaliação.
    const rank = (source: FieldSource) =>
        source.faixa === "baixa" ? 0 : source.faixa === null ? 1 : 2;
    const toReview = Object.entries(fieldSources)
        .filter(([, source]) => rank(source) < 2)
        .sort((a, b) => rank(a[1]) - rank(b[1]))
        .map(([key]) => key)
        .slice(0, 20);

    return {
        confidence_version: "1.0",
        faixa_documento: band,
        faixa_documento_motivos:
            band === "alta"
                ? []
                : [{ criterio: band === "baixa" ? "nao_identificadas" : "expanded_ocr", fracao: band === "baixa" ? 0.13 : 0.31, limite: 0.1 }],
        paginas: {
            total: totalPages,
            total_pdf: totalPages,
            identificadas: totalPages - unidentified,
            ignoradas: 0,
            unresolved: 0,
            nao_identificadas: Array.from({ length: unidentified }, (_, i) => 6 + i * 3),
            nao_identificadas_com_texto: 0,
        },
        campos_para_revisar: toReview,
    };
}

// ---------------------------------------------------------------------------
// Banco inicial
// ---------------------------------------------------------------------------

function isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 86_400_000).toISOString();
}

export function createSeedDb(): MockDb {
    const records: MockRecord[] = [
        { dnv: "99000000001", owner_id: USER_ID, structured_data: buildStructuredData(0, "99000000001"), created_at: isoDaysAgo(6), updated_at: isoDaysAgo(6) },
        { dnv: "99000000002", owner_id: USER_ID, structured_data: buildStructuredData(1, "99000000002"), created_at: isoDaysAgo(4), updated_at: isoDaysAgo(3) },
        { dnv: "99000000003", owner_id: USER_ID, structured_data: buildStructuredData(2, "99000000003"), created_at: isoDaysAgo(1), updated_at: isoDaysAgo(1) },
        // Mesmo DNV do primeiro registro, mas de outro dono: permite testar,
        // como admin, o caso "DNV com registros de mais de um usuário".
        { dnv: "99000000001", owner_id: ADMIN_ID, structured_data: buildStructuredData(0, "99000000001", { apgar_1min: "8" }), created_at: isoDaysAgo(2), updated_at: isoDaysAgo(2) },
        { dnv: "99000000010", owner_id: ADMIN_ID, structured_data: buildStructuredData(2, "99000000010"), created_at: isoDaysAgo(5), updated_at: isoDaysAgo(5) },
    ];

    const secondRecord = records[1];

    return {
        users: seedUsers.map((user) => ({ ...user })),
        records,
        predictions: [
            {
                dnv: secondRecord.dnv,
                owner_id: USER_ID,
                model_name: "modelo-demonstracao",
                model_version: "0.0.0",
                preprocessing_version: "demo",
                status: "success",
                predicted_class: 1,
                predicted_probability: 0.52,
                risk_band: "alto",
                calibration: {
                    method: "prior_shift",
                    prior: 0.188,
                    band_cutoffs: [0.15, 0.35],
                    provisional: true,
                },
                core_features_missing: [],
                data_quality: "ok",
                features_filled: 22,
                features_total: 24,
                missing_features: ["tempo_cateter_umbilical_arterial_dias", "hr_vida_primeira_dose_surfactante"],
                disclaimer: "Resultado gerado com dados sintéticos (modo demonstração). Não use para decisões clínicas.",
                is_stale: false,
                created_at: isoDaysAgo(3),
                source_updated_at: secondRecord.updated_at,
            },
        ],
        jobs: [],
        counters: { dnv: 100 },
    };
}