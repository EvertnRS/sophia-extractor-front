import type { FieldConfidence } from "../data/confidence";

export interface EditableField {
    path: string;
    label: string;
    value: string;
    sourcePages?: number[];
    confidence?: FieldConfidence | null;
}