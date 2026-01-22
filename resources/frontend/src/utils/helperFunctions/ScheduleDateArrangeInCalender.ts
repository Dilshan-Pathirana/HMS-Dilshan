import { daysOfWeek } from "../types/Website/dateUtils.ts";
export function getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

export function getOneMonthLater(): Date {
    const date = getToday();
    date.setMonth(date.getMonth() + 1);
    if (date.getDate() !== getToday().getDate()) {
        date.setDate(0);
    }
    return date;
}

export const filterScheduleDays = (date: Date, scheduleDay: string): boolean => {
    if (!scheduleDay) return false;
    const dateDay = daysOfWeek[date.getDay()];
    return dateDay === scheduleDay && date >= getToday() && date <= getOneMonthLater();
};
