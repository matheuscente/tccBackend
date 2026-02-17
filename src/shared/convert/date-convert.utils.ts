import type { IDateConvert } from "./interfaces/date-convert.interface";

export class DateConvert implements IDateConvert {
    dateToSeconds(date: Date): number {
        return Math.floor(date.getTime() / 1000)
    }

    secondsToDate(seconds: number): Date {
        return new Date(seconds * 1000)
    }
}