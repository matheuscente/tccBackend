export interface ISanitize {
   removeAccents(value: string): string
   sanitizeName(name: string): string
   sanitizeUsername(username: string): string
}