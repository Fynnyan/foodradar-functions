import {addDays, formatISO, getDay} from "date-fns";

export function formatIsoDate(date: Date): string {
    return formatISO(date, {representation: 'date'})
}

export function parseGermanDayOfWeek(germanDay: string | null): number | null {
    // follow the date-fs week days, a week starts with sunday, number 0
    switch (germanDay?.toLowerCase()) {
        case "montag":
            return 1
        case "dienstag":
            return 2
        case "mittwoch":
            return 3
        case "donnerstag":
            return 4
        case "freitag":
            return 5
        default:
            return null
    }
}

export function getDayOfWeek(day: number): string {
    // follow the date-fs week days, a week starts with sunday, number 0
    switch (day) {
        case 0:
            return "SUNDAY"
        case 1:
            return "MONDAY"
        case 2:
            return "TUESDAY"
        case 3:
            return "WEDNESDAY"
        case 4:
            return  "THURSDAY"
        case 5:
            return "FRIDAY"
        default:
            return "SATURDAY"
    }
}

export function getDateRelativeOfWeekdayForCurrentWeek(dayOfWeek: number): Date {
    const now = new Date()
    const currentDay = getDay(now)
    const op = dayOfWeek - currentDay
    return addDays(now, op)
}