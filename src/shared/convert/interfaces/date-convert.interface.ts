export interface IDateConvert {
    dateToSeconds(date: Date): number 
    
    extractDate(date: string): [number, number, number] 
    
    dateFormat(date: string | Date): Date
    
    getCurrentDate(): Date,
    
    secondsToDate(seconds: number): Date

    normalize(date: Date): Date
    
}