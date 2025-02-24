export interface Place {
    name: string;
    web: string;
    menus: Menu[]
    processingStatus: ProcessingStatus
}

export enum ProcessingStatus {
    SITE_NOT_ACCESSIBLE = "SITE_NOT_ACCESSIBLE",
    PROCESS_ERROR = "PROCESS_ERROR",
    PROCESSED = "PROCESSED"

}

export interface Menu {
    date: string;
    courses: Course[],
}

export interface Course {
    name: string;
    price?: string;
}

export interface FoodTruck {
    id: string,
    name: string,
    web: string,
    location: string,
    days: string[]
}