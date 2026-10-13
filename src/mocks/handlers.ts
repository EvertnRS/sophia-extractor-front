import { delay, http, HttpResponse } from "msw";
import { MOCK_API_BASE } from "./config";
import { getDb, saveDb } from "./db";
import {
    PROFILE_COUNT,
    buildFieldSources,
    buildQuality,
    buildStructuredData,
    type MockDb,
    type MockPrediction,
    type MockRecord,
    type MockUser,
} from "./seed";

/*
 * Handlers do MSW: imitam os endpoints do backend que o frontend usa.
 * Cada um responde com o mesmo formato (e os mesmos códigos HTTP) que o
 * código em src/api/ espera. Se um endpoint novo for criado no backend e usado
 * no frontend, é aqui que ele precisa ganhar uma versão falsa.
 */

// Tempo que uma extração "demora" (para a barra de progresso aparecer).
const EXTRACTION_DURATION_MS = 10_000;
// Latência artificial das respostas.
const LATENCY_MS = 150;
// Máximo de extrações guardadas (cada uma carrega ~90 campos).
const MAX_JOBS = 20;

const url = (path: string) => `${MOCK_API_BASE}${path}`;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function error(status: number, detail: string) {
    return HttpResponse.json({ detail }, { status });
}

function publicUser({ id, email, role, is_active }: MockUser) {
    return { id, email, role, is_active };
}

function tokenFor(user: MockUser) {
    return `mock-token.${user.id}`;
}

/** Usuário dono do token enviado, ou null (sem token, inválido ou inativo). */
function authenticate(request: Request, db: MockDb): MockUser | null {
    const header = request.headers.get("Authorization") ?? "";
    const token = header.replace(/^Bearer\s+/i, "");
    const userId = token.startsWith("mock-token.") ? token.slice("mock-token.".length) : null;
    const user = db.users.find((candidate) => candidate.id === userId);
    return user && user.is_active ? user : null;
}

function ownerParam(request: Request): string | null {
    return new URL(request.url).searchParams.get("owner_id");
}

/** Registros que o usuário pode ver: todos (admin) ou só os próprios. */
function visibleRecords(db: MockDb, user: MockUser): MockRecord[] {
    return user.role === "admin"
        ? db.records
        : db.records.filter((record) => record.owner_id === user.id);
}

type Target = { record: MockRecord } | { failure: Response };

/**
 * Descobre qual registro uma operação em /{dnv} atinge.
 * Usuário comum: sempre o próprio. Admin: o `owner_id` informado ou, sem ele,
 * o único existente -- se houver mais de um dono, 409 (igual ao backend).
 */
function resolveTarget(db: MockDb, user: MockUser, dnv: string, ownerId: string | null): Target {
    let candidates = db.records.filter((record) => record.dnv === dnv);

    if (user.role === "admin") {
        if (ownerId) candidates = candidates.filter((record) => record.owner_id === ownerId);
    } else {
        candidates = candidates.filter((record) => record.owner_id === user.id);
    }

    if (candidates.length === 0) return { failure: error(404, "Registro não encontrado.") };
    if (candidates.length > 1) {
        return { failure: error(409, "Há mais de um registro com este DNV. Informe o owner_id.") };
    }
    return { record: candidates[0] };
}

function nowIso() {
    return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Predição sintética (não é um modelo real: só uma fórmula plausível)
// ---------------------------------------------------------------------------

const MODEL_FEATURES = [
    "idade_semanal_gestacional", "peso", "apgar_1min", "apgar_5min", "idade_materna",
    "qt_consultas", "vl_perimetro_cefalico", "temp_admissao", "vent_mecanica_dias",
    "tempo_o2_dias", "tempo_parenteral", "tp_primeira_enteral", "sepse", "sdr",
    "surfactante", "ecn", "hemorragia_intracraniana", "tp_parto", "sexo",
    "gestacao_multipla", "esteroide_anteneonatal", "sulfato_magnesio",
    "tempo_cateter_umbilical_arterial", "hr_vida_primeira_dose_surfactante",
];

function num(value: unknown, fallback: number): number {
    const parsed = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) && String(value ?? "").trim() !== "" ? parsed : fallback;
}

function buildPrediction(record: MockRecord): MockPrediction {
    const data = record.structured_data;
    const sepse = data.sepse === "Sim" ? 1 : 0;
    const ventDays = num(data.vent_mecanica_dias, 0);

    const z =
        -1 +
        (32 - num(data.idade_semanal_gestacional, 32)) * 0.35 +
        ((1500 - num(data.peso, 1500)) / 1000) * 1.2 +
        (7 - num(data.apgar_5min, 7)) * 0.3 +
        sepse +
        (ventDays > 0 ? 0.5 : 0);
    const probability = 1 / (1 + Math.exp(-z));

    const missing = MODEL_FEATURES.filter((key) => String(data[key] ?? "").trim() === "");

    return {
        dnv: record.dnv,
        owner_id: record.owner_id,
        model_name: "modelo-demonstracao",
        model_version: "0.0.0",
        preprocessing_version: "demo",
        status: "success",
        predicted_class: probability >= 0.5 ? 1 : 0,
        predicted_probability: Number(probability.toFixed(4)),
        features_filled: MODEL_FEATURES.length - missing.length,
        features_total: MODEL_FEATURES.length,
        missing_features: missing,
        disclaimer:
            "Resultado gerado com dados sintéticos (modo demonstração). Não use para decisões clínicas.",
        is_stale: false,
        created_at: nowIso(),
        source_updated_at: record.updated_at,
    };
}

function publicPrediction(prediction: MockPrediction, record: MockRecord) {
    const { source_updated_at, ...rest } = prediction;
    return { ...rest, is_stale: source_updated_at !== record.updated_at };
}

// ---------------------------------------------------------------------------
// Extração: estado calculado a partir do tempo decorrido
// ---------------------------------------------------------------------------

function jobStatus(job: { job_id: string; filename: string; created_at: string }) {
    const elapsed = Date.now() - new Date(job.created_at).getTime();
    const progress = Math.min(100, Math.floor((elapsed / EXTRACTION_DURATION_MS) * 100));
    const done = progress >= 100;

    let message = "Finalizando...";
    if (done) message = "Extração concluída.";
    else if (progress < 20) message = "Lendo o PDF...";
    else if (progress < 60) message = "Identificando páginas...";
    else if (progress < 90) message = "Extraindo campos...";

    return {
        job_id: job.job_id,
        filename: job.filename,
        status: done ? "completed" : "processing",
        progress,
        message,
        error: null,
        created_at: job.created_at,
        updated_at: done
            ? new Date(new Date(job.created_at).getTime() + EXTRACTION_DURATION_MS).toISOString()
            : nowIso(),
    };
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers = [
    // ----- Autenticação -----------------------------------------------------
    http.post(url("/auth/login"), async ({ request }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const body = (await request.json()) as { email?: string; password?: string };
        const user = db.users.find(
            (candidate) => candidate.email.toLowerCase() === (body.email ?? "").trim().toLowerCase()
        );

        if (!user || user.password !== body.password) {
            return error(401, "E-mail ou senha inválidos.");
        }
        if (!user.is_active) return error(403, "Usuário inativo.");

        return HttpResponse.json({ access_token: tokenFor(user), token_type: "bearer" });
    }),

    http.get(url("/auth/me"), async ({ request }) => {
        await delay(LATENCY_MS);
        const user = authenticate(request, getDb());
        if (!user) return error(401, "Não autenticado.");
        return HttpResponse.json(publicUser(user));
    }),

    // ----- Usuários (somente admin) ----------------------------------------
    http.get(url("/auth/users"), async ({ request }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");
        if (user.role !== "admin") return error(403, "Acesso restrito a administradores.");
        return HttpResponse.json(db.users.map(publicUser));
    }),

    http.post(url("/auth/users"), async ({ request }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const admin = authenticate(request, db);
        if (!admin) return error(401, "Não autenticado.");
        if (admin.role !== "admin") return error(403, "Acesso restrito a administradores.");

        const body = (await request.json()) as { email: string; password: string; role?: string };
        const email = (body.email ?? "").trim();
        if (db.users.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) {
            return error(409, "Já existe um usuário com este e-mail.");
        }

        const created: MockUser = {
            id: `mock-user-${crypto.randomUUID().slice(0, 8)}`,
            email,
            password: body.password,
            role: body.role === "admin" ? "admin" : "user",
            is_active: true,
        };
        db.users.push(created);
        saveDb();
        return HttpResponse.json(publicUser(created), { status: 201 });
    }),

    http.patch(url("/auth/users/:id"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const admin = authenticate(request, db);
        if (!admin) return error(401, "Não autenticado.");
        if (admin.role !== "admin") return error(403, "Acesso restrito a administradores.");

        const target = db.users.find((candidate) => candidate.id === String(params.id));
        if (!target) return error(404, "Usuário não encontrado.");

        const body = (await request.json()) as {
            email?: string; password?: string; role?: string; is_active?: boolean;
        };

        if (body.email !== undefined) {
            const email = body.email.trim();
            const taken = db.users.some(
                (candidate) => candidate.id !== target.id && candidate.email.toLowerCase() === email.toLowerCase()
            );
            if (taken) return error(409, "Já existe um usuário com este e-mail.");
            target.email = email;
        }
        if (body.password) target.password = body.password;
        if (body.role === "admin" || body.role === "user") target.role = body.role;
        if (typeof body.is_active === "boolean") target.is_active = body.is_active;

        saveDb();
        return HttpResponse.json(publicUser(target));
    }),

    // Soft delete: só desativa, como no backend real.
    http.delete(url("/auth/users/:id"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const admin = authenticate(request, db);
        if (!admin) return error(401, "Não autenticado.");
        if (admin.role !== "admin") return error(403, "Acesso restrito a administradores.");

        const target = db.users.find((candidate) => candidate.id === String(params.id));
        if (!target) return error(404, "Usuário não encontrado.");

        target.is_active = false;
        saveDb();
        return HttpResponse.json(publicUser(target));
    }),

    // ----- Extração de PDF --------------------------------------------------
    http.post(url("/api/extractions"), async ({ request }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        let filename = "documento.pdf";
        try {
            const form = await request.formData();
            const file = form.get("file");
            if (file instanceof File && file.name) filename = file.name;
        } catch {
            // Sem corpo multipart legível: segue com o nome padrão.
        }

        // O PDF não é lido: cada envio recebe o próximo "perfil" sintético
        // e um DNV novo.
        const sequence = db.counters.dnv;
        db.counters.dnv += 1;
        const dnv = `99000${String(sequence).padStart(6, "0")}`;
        const profile = sequence % PROFILE_COUNT;

        const structuredData = buildStructuredData(profile, dnv);
        const fieldSources = buildFieldSources(structuredData, dnv);

        const job = {
            job_id: `mock-job-${crypto.randomUUID().slice(0, 8)}`,
            filename,
            created_at: nowIso(),
            structured_data: structuredData,
            field_sources: fieldSources,
            quality: buildQuality(profile, fieldSources),
        };

        db.jobs.push(job);
        if (db.jobs.length > MAX_JOBS) db.jobs.splice(0, db.jobs.length - MAX_JOBS);
        saveDb();

        return HttpResponse.json(jobStatus(job), { status: 202 });
    }),

    http.get(url("/api/extractions/:jobId/status"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        if (!authenticate(request, db)) return error(401, "Não autenticado.");

        const job = db.jobs.find((candidate) => candidate.job_id === String(params.jobId));
        if (!job) return error(404, "Extração não encontrada.");
        return HttpResponse.json(jobStatus(job));
    }),

    http.get(url("/api/extractions/:jobId/result"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        if (!authenticate(request, db)) return error(401, "Não autenticado.");

        const job = db.jobs.find((candidate) => candidate.job_id === String(params.jobId));
        if (!job) return error(404, "Extração não encontrada.");
        if (jobStatus(job).status !== "completed") return error(409, "Extração ainda em andamento.");
        return HttpResponse.json({ job_id: job.job_id, status: "completed", data: job.structured_data });
    }),

    http.post(url("/api/extractions/:jobId/structured"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        if (!authenticate(request, db)) return error(401, "Não autenticado.");

        const job = db.jobs.find((candidate) => candidate.job_id === String(params.jobId));
        if (!job) return error(404, "Extração não encontrada.");
        if (jobStatus(job).status !== "completed") return error(409, "Extração ainda em andamento.");

        return HttpResponse.json({
            job_id: job.job_id,
            status: "completed",
            data: {
                filename: job.filename,
                structured_data: job.structured_data,
                field_sources: job.field_sources,
                quality: job.quality,
            },
        });
    }),

    // ----- Predição ---------------------------------------------------------
    http.get(url("/api/predictions/:dnv"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const target = resolveTarget(db, user, String(params.dnv), ownerParam(request));
        if ("failure" in target) return target.failure;

        const { record } = target;
        const prediction = db.predictions.find(
            (candidate) => candidate.dnv === record.dnv && candidate.owner_id === record.owner_id
        );
        if (!prediction) return error(404, "Nenhuma predição calculada para este registro.");
        return HttpResponse.json(publicPrediction(prediction, record));
    }),

    http.post(url("/api/predictions/:dnv"), async ({ request, params }) => {
        await delay(LATENCY_MS * 4);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const target = resolveTarget(db, user, String(params.dnv), ownerParam(request));
        if ("failure" in target) return target.failure;

        const { record } = target;
        const created = buildPrediction(record);
        db.predictions = db.predictions.filter(
            (candidate) => !(candidate.dnv === record.dnv && candidate.owner_id === record.owner_id)
        );
        db.predictions.push(created);
        saveDb();
        return HttpResponse.json(publicPrediction(created, record));
    }),

    // ----- Dados estruturados (registros revisados e salvos) ---------------
    http.post(url("/create"), async ({ request }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const body = (await request.json()) as { structured_data?: Record<string, unknown> };
        const data = body.structured_data ?? {};
        const dnv = typeof data.dnv === "string" ? data.dnv.trim() : "";
        if (!dnv) return error(422, "O campo dnv é obrigatório.");

        if (db.records.some((record) => record.dnv === dnv && record.owner_id === user.id)) {
            return error(409, "Já existe um registro com este DNV.");
        }

        const record: MockRecord = {
            dnv,
            owner_id: user.id,
            structured_data: { ...data, dnv },
            created_at: nowIso(),
            updated_at: nowIso(),
        };
        db.records.push(record);
        saveDb();
        return HttpResponse.json(record, { status: 201 });
    }),

    http.get(url("/"), async ({ request }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const records = [...visibleRecords(db, user)].sort((a, b) =>
            b.updated_at.localeCompare(a.updated_at)
        );
        return HttpResponse.json(records);
    }),

    // Usuário comum: no máximo um registro. Admin: um objeto, ou uma lista
    // quando o mesmo DNV existe para mais de um usuário.
    http.get(url("/:dnv"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const matches = visibleRecords(db, user).filter((record) => record.dnv === String(params.dnv));
        if (matches.length === 0) return error(404, "Registro não encontrado.");
        return HttpResponse.json(matches.length === 1 ? matches[0] : matches);
    }),

    http.put(url("/update/:dnv"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const target = resolveTarget(db, user, String(params.dnv), ownerParam(request));
        if ("failure" in target) return target.failure;

        const body = (await request.json()) as { structured_data?: Record<string, unknown> };
        const { record } = target;
        record.structured_data = { ...(body.structured_data ?? {}), dnv: record.dnv };
        record.updated_at = nowIso();
        saveDb();
        return HttpResponse.json(record);
    }),

    http.delete(url("/delete/:dnv"), async ({ request, params }) => {
        await delay(LATENCY_MS);
        const db = getDb();
        const user = authenticate(request, db);
        if (!user) return error(401, "Não autenticado.");

        const target = resolveTarget(db, user, String(params.dnv), ownerParam(request));
        if ("failure" in target) return target.failure;

        const { record } = target;
        db.records = db.records.filter((candidate) => candidate !== record);
        db.predictions = db.predictions.filter(
            (candidate) => !(candidate.dnv === record.dnv && candidate.owner_id === record.owner_id)
        );
        saveDb();
        return HttpResponse.json({ message: "Registro removido." });
    }),
];