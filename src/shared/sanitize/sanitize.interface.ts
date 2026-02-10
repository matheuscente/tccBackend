export interface Isanitize {
   removeAccents(value: string): string
   sanitizeName(name: string): string
   sanitizeUsername(username: string): string
}