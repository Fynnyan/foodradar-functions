import {load} from 'cheerio';
import {app, HttpRequest, HttpResponseInit, InvocationContext} from "@azure/functions";
import {Course, Menu, Place, ProcessingStatus} from "../components/Types";
import {formatIsoDate, getDateRelativeOfWeekdayForCurrentWeek, parseGermanDayOfWeek} from "../components/Helpers";

app.http("schichtwechsel-menu", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "place/schichtwechsel",
    handler: fetchSchichtwechselMenu
})

export async function fetchSchichtwechselMenu(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const serviceName = "Schichtwechsel"
    const serviceUrl = "https://schichtwechsel.ch"
    let body: Place
    try {
        const menus = await fetch(serviceUrl)
            .then(response => response.text())
            .then(html => {
                const $ = load(html);
                const menus: Menu[] = []
                let lastParsedDayOfWeek: number | null = null
                $(".wochenmenue")
                    .each((_, element) => {
                        let day = $(element)
                            .find("h3")
                            .first()
                            .text()
                            ?.toLowerCase()
                        if (day != null) lastParsedDayOfWeek = parseGermanDayOfWeek(day)

                        const menuText: string | null = $(element).find("p").text()

                        if (day != "täglich") {
                            const calcDate =
                                formatIsoDate(
                                    getDateRelativeOfWeekdayForCurrentWeek(
                                        parseGermanDayOfWeek(day) || lastParsedDayOfWeek
                                    )
                                )
                            const course: Course = {name: menuText, price: null}
                            const existingIndex = menus.findIndex( m => m.date == calcDate)
                            if (existingIndex >= 0) {
                                const existing = menus[existingIndex]
                                existing.courses.push(course)
                                menus[existingIndex] = existing
                            }
                            else {
                                menus.push({
                                    date: calcDate,
                                    courses: [course]
                                })
                            }
                        }
                    })
                    return menus
                })
        body = {
            name: serviceName,
            web: serviceUrl,
            menus: menus,
            processingStatus: ProcessingStatus.PROCESSED
        }
    } catch (error) {
        context.error("Could not process / parse the schichtwechsel menu, error:", error.message)
        body = {
            processingStatus: ProcessingStatus.PROCESS_ERROR,
            name: serviceName,
            web: serviceUrl,
            menus: []
        }
    }
    return {
        status: 200,
        jsonBody: body
    }
}