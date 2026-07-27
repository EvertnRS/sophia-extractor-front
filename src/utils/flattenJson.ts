import type { EditableField } from "../types/editableLabel";

export function flattenObject(
    obj: unknown,
    parent = ""
): EditableField[] {

    const fields: EditableField[] = [];

    if (obj === null || obj === undefined) {
        return fields;
    }

    if (typeof obj !== "object") {
        fields.push({
            path: parent,
            label: parent.split(".").pop() ?? parent,
            value: String(obj),
        });

        return fields;
    }

    for (const [key, value] of Object.entries(obj)) {

        const path = parent
            ? `${parent}.${key}`
            : key;

        if (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            fields.push(...flattenObject(value, path));
        } else {
            fields.push({
                path,
                label: key.replaceAll("_", " "),
                value: String(value ?? ""),
            });
        }
    }

    return fields;
}