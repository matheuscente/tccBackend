import { ValidationError } from "../../errors/validation-error";
import type { IDateConvert } from "../interfaces/date-convert.interface";

export class DateConvert implements IDateConvert {
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
        const now = new Date();
        return new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
        );
    }

private normalize(date: Date): Date {
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ))
}

}