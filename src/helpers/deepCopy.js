export function deepCopy(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Non-object or null values are returned directly
    }

    const copy = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            copy[key] = deepCopy(obj[key]); // Recursively copy nested objects
        }
    }

    return copy;
}