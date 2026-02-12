import type { IHashUtils } from "../hash/interfaces/hash-utils.interface";
import bcrypt from "bcrypt";


export class Hash implements IHashUtils {
  constructor(private readonly salts: number) {
    if (!salts || salts <= 0) {
      throw new Error("saltRounds inválido ao criar HashService");
    }
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.salts);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
