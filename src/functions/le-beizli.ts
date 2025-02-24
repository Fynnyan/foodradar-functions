import {load} from 'cheerio';
import {app, HttpRequest, HttpResponseInit, InvocationContext} from "@azure/functions";
import {Menu, Place, ProcessingStatus} from "../components/Types";
import {getDocument} from "pdfjs-dist";
import {TextItem} from "pdfjs-dist/types/src/display/api";
import {formatIsoDate} from "../components/Helpers";
import {parse} from "date-fns";

app.http("le-beizli-menu", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "place/le-beizli",
    handler: fetchBeizliMenu
})

export async function fetchBeizliMenu(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const baseUrl = "http://www.lebeizli.ch"
    const serviceName = "Le-Beizli"
    const serviceUrl = baseUrl + "/flavours"
    let body: Place
    try {
        const menus = await fetch(serviceUrl)
            .then(response => response.text())
            .then(async html => {
                const $ = load(html);
                const menus: Menu[] = []
                let lastParsedDayOfWeek: number | null = null
                const linkToPdf = baseUrl + $('a:icontains("mittagsmenu")').attr('href')
                const p = getDocument(linkToPdf)
                const menuText: string = await p.promise.then(pdf => pdf.getPage(1))
                    .then(pdf => pdf.getTextContent())
                    .then(text =>
                        text.items
                            // filter out empty and blank elements
                            .filter((i: TextItem) => i.str.trim().length != 0)
                            // get the y position of the text element in the pdf. map pos to text for sorting
                            // 0 point is at the bottom left.
                            .map((i: TextItem) => [i.transform[5], i.str])
                            // sort by pos, highest first
                            .sort((a,b) => b[0] - a[0])
                            .map(posToText => posToText[1])
                            .reduce((pre, current) => pre + " " + current)
                    )
                const textDate = menuText.match(dateRegex)?.at(0)
                menus.push( {
                    date: textDate
                        ? formatIsoDate(parse(textDate, 'dd.MM.yyyy', new Date()))
                        : formatIsoDate(new Date()),
                    courses: [
                        menuText.match(saladeRegex),
                        menuText.match(vegiRegex),
                        menuText.match(quicheRegex),
                        menuText.match(pastaRegex),
                        menuText.match(dopaminRegex),
                        menuText.match(meatRegex),
                    ]
                        .flat()
                        .filter(m => m)
                        .map(m => { return {name: cleanMenuText(m), price: null} })
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

function buildMenuRegex(id: string, startToken: string, endTokens: string[]) {
    return new RegExp(`(?<${id}>${startToken}(?:(?!(${endTokens.join("|")})).)*)`, "ig")
}

function cleanMenuText(text: string) {
    return text.replace(priceRegex, "").trim()
}

// Tokens, beginning of the titles of the different daily menu items
const saladeToken = "salade champ"
const quicheToken = "quiche"
const pastaToken = "pasta"
const vegiToken = "garten"
const meatToken = "fleischer"
const dopaminToken = "dopaminration"
const suessesSection = "SÜSSES"

const saladeRegex = buildMenuRegex("salade", saladeToken, [quicheToken, meatToken, pastaToken, vegiToken, dopaminToken, suessesSection])
const quicheRegex = buildMenuRegex("quiche", quicheToken, [meatToken, pastaToken, vegiToken, dopaminToken, suessesSection])
const pastaRegex = buildMenuRegex("pasta", pastaToken, [meatToken, quicheToken, vegiToken, dopaminToken, suessesSection])
const dopaminRegex = buildMenuRegex("dopamin", dopaminToken, [meatToken, pastaToken, vegiToken, quicheToken, suessesSection])
const meatRegex = buildMenuRegex("fleisch", meatToken, [dopaminToken, pastaToken, vegiToken, quicheToken, suessesSection])
const vegiRegex = buildMenuRegex("garten", vegiToken, [meatToken, quicheToken, pastaToken, dopaminToken, suessesSection])
const priceRegex = new RegExp("(\\+[\\d.]|\\d+[\\s.|]+)")
const dateRegex = new RegExp("\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}", "ig")