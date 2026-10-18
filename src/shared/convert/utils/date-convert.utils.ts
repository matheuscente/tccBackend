import { ValidationError } from "../../errors/validation-error";
import type { IDateConvert } from "../interfaces/date-convert.interface";

export class DateConvert implements IDateConvert {
    /**
     * @param timeZone fuso usado para saber qual é o "dia de hoje" do usuário
     * (ex.: às 22h no Brasil ainda é o mesmo dia, embora em UTC já seja o dia seguinte).
     */
    constructor(private readonly timeZone: string = "America/Sao_Paulo") {}

    dateToSeconds(date: Date): number {
        return Math.floor(date.getTime() / 1000)
    }

    secondsToDate(seconds: number): Date {
        return new Date(seconds * 1000)
    }

    extractDate(date: string): [number, number, number] {
        const parts = date.split("/");

        if (parts.length !== 3) {
            throw new ValidationError("Data inválida!");
        }
        const day = parseInt(parts[0]!, 10);
        const month = parseInt(parts[1]!, 10) - 1;
        const year = parseInt(parts[2]!, 10);

        if ([day, month, year].some(Number.isNaN)) {
            throw new ValidationError("Data inválida!");
        }

        return [day, month, year];
    }

    dateFormat(date: string | Date): Date {
    if (date instanceof Date) {
        return this.normalize(date)
    }

    const [day, month, year] = this.extractDate(date);

    const formattedDate = new Date(Date.UTC(year, month, day));

    if (
        formattedDate.getUTCFullYear() !== year ||
        formattedDate.getUTCMonth() !== month ||
        formattedDate.getUTCDate() !== day
    ) {
        throw new ValidationError("Data inválida!");
    }

    return formattedDate;
}

    getCurrentDate(): Date {
        // en-CA formata como AAAA-MM-DD
        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: this.timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

        const [year, month, day] = today.split("-").map(Number);

        return new Date(Date.UTC(year!, month! - 1, day!));
    }

    normalize(date: Date): Date {
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ))
}

}