import type { IRepositories } from "./repositories.interface";

export interface ITransaction {
  execute<T>(work: (repositories: IRepositories) => Promise<T>): Promise<T>
}