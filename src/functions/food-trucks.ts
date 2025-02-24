import {app, HttpRequest, HttpResponseInit, InvocationContext} from "@azure/functions";
import {FoodTruck} from "../components/Types";
import {getDay} from "date-fns";
import {getDayOfWeek} from "../components/Helpers";

app.http("food-trucks-today", {
    methods: ["GET"],
    authLevel: "anonymous",
    route:"food-trucks/today",
    handler: fetchFoodTrucksToday
})

export async function fetchFoodTrucksToday(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {

    const foodTrucks: FoodTruck[] = [{
        "id": "b57d252b-cf34-4bac-9ca5-a4418062aa30",
        "name": "FireChefs",
        "web": "https://www.firechefs.ch/food-truck",
        "location": "Liebefeld Park",
        "days": ["TUESDAY"]
    }, {
        "id": "ffba5b3d-187a-4b30-a38e-6d626941479c",
        "name": "Gabriele",
        "web": "https://www.gabriele-streetfood.ch/",
        "location": "Liebefeld Bahnhof",
        "days": ["MONDAY", "WEDNESDAY"]
    }, {
        "id": "981d9604-2b1c-4378-8740-7c4943e4d411",
        "name": "Mê - vietnamese cuisine",
        "web": "https://mevietnam.ch/",
        "location": "Liebefeld Bahnhof",
        "days": ["TUESDAY", "THURSDAY"]
    }]

    const currentDay = getDayOfWeek(getDay(new Date()))

    return {
        status: 200,
        jsonBody: foodTrucks.filter(truck => truck.days.find(day => day === currentDay))
    }
}