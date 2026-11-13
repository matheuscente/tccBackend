import { ValidationError } from "../../errors/validation-error";
import type { IDateConvert } from "../interfaces/date-convert.interface";

// datas "de calendário" (dia de estudo, início de meta etc.) são guardadas como meia-noite UTC daquele dia
export class DateConvert implements IDateConvert {
    // fuso usado para saber qual é o "dia de hoje" do usuário (às 22h no Brasil ainda é o mesmo dia, embora em UTC já seja o seguinte)
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

    // instante real em que o dia de calendário começa no fuso configurado (para filtrar timestamps como finishedAt)
    startOfDayInTimeZone(date: Date): Date {
        const day = this.normalize(date)

        const firstGuess = new Date(day.getTime() - this.offsetMs(day))

        // recalcula com o offset do próprio instante, caso o dia tenha mudança de horário de verão
        return new Date(day.getTime() - this.offsetMs(firstGuess))
    }

    private offsetMs(instant: Date): number {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: this.timeZone,
            hourCycle: "h23",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }).formatToParts(instant)

        const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)!.value)

        const localAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))

        return localAsUtc - Math.floor(instant.getTime() / 1000) * 1000
    }
}
