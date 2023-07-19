const fs = require('fs');


export function isNotEmptyString(value: any): boolean {
    return typeof value === "string" && value.trim() !== "";
}

