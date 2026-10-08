export function formatDateTime(iso: string | null | undefined): string | null {
    if (!iso) return null;

    const date = new Date(/(Z|[+-]\d\d:\d\d)$/.test(iso) ? iso : `${iso}Z`);

    return Number.isNaN(date.getTime()) ? null : date.toLocaleString("pt-BR");
}