import {load} from 'cheerio';
import {app, HttpRequest, HttpResponseInit, InvocationContext} from "@azure/functions";
import {Course, Menu, Place, ProcessingStatus} from "../components/Types";
import {parse} from "date-fns";
import {formatIsoDate} from "../components/Helpers";

app.http("dreigaenger-menu", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "place/dreiganger",
    handler: fetchDreigaengerMenu
})

export async function fetchDreigaengerMenu(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const serviceName = "Dreigänger"
    const serviceUrl = "https://dreigaenger.ch"
    let body: Place
    try {
        const menus = await fetch(serviceUrl)
            .then(response => response.text())
            .then(html => {
                const $ = load(html);
                return $(".carousel-inner")
                    .first()
                    .children()
                    .map((_, card): Menu => {
                        // expected format: Mittwoch, 05.02.2025
                        const textDate = $(card).find(".menu_date")
                            .text()
                            .split(",")[1]
                            .trim()
                        return {
                            date: formatIsoDate(parse(textDate, 'dd.MM.yyyy', new Date())),
                            courses: $(card)
                                .find(".menu_text")
                                .map((_, menu) => $(menu).text().trim())
                                .toArray()
                                // ignore the price for now
                                .map((menu): Course => { return { name: menu, price: null } })
                        }
                    }).toArray()
            })
        body = {
            name: serviceName,
            web: serviceUrl,
            menus: menus,
            processingStatus: ProcessingStatus.PROCESSED
        }
    } catch (error) {
        context.error("Could not process / parse the dreigänger menu, error:", error.message)
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