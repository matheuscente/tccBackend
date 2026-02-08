export abstract class Sanitize {
  static removeAccents(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  static sanitazeName(name: string): string {
    return this.removeAccents(
        name
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase()
    )
  }

  static sanitazeUsername(username: string) {
    return this.removeAccents(
        username   
            .trim()
            .toLocaleLowerCase()
    )
  }
}

