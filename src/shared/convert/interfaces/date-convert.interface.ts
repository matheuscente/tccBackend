export interface IDateConvert {
    dateToSeconds(date: Date): number,
    secondsToDate(seconds: number): Date
}