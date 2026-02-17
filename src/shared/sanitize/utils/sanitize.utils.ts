import type { Isanitize } from "../interfaces/sanitize.interface";

export class SanitizeUtils implements Isanitize {
 removeAccents(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

 sanitizeName(name: string): string {
    return this.removeAccents(
        name
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase()
    )
  }

 sanitizeUsername(username: string) {
    return this.removeAccents(
        username   
            .trim()
            .toLowerCase()
    )
  }
}

