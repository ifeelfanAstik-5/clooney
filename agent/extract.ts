import { chromium } from 'playwright'
import fs from 'fs'
import { extractRenderedTree } from './utils';

export const extract = async (waitForEnter: () => Promise<void>): Promise<any> =>{
    const browser = await chromium.launch({headless: false});

    const context = await browser.newContext();
    const page = await context.newPage();

    const apiCalls: any[] = [];

    page.on("response", async (res)=>{
        const ct = res.headers()["content-type"] || "";
        if(ct.includes("application/json")) {
            try {
                const body = await res.text();
                const json = body.startsWith(')]}\'') ? body.slice(5) : body; // Remove JSONP prefix if present
                const parsed = JSON.parse(json);
                apiCalls.push({
                    url: res.url,
                    status: res.status(),
                    body: parsed
                })
            } catch (error: Error | any) {
                console.log('Failed to parse JSON response from', res.url(), error.message)
            }
        }
    })

    await page.goto("https://app.asana.com", { timeout: 60000 });

    await waitForEnter();

    const pages : Record<string,any> = {};

    const capture = async (name: string) =>{
        // const html = await page.evaluate(()=>{ document.documentElement.outerHTML });
        // pages[name] = { html };
        const tree = await extractRenderedTree(page);
        pages[name] = { tree };
    }

    console.log("Starting capture: home");
    await capture("home");
    console.log("Captured home");

    await page.goto("https://app.asana.com/0/home");

    console.log("Starting capture: projects");
    await capture("projects");
    console.log("Captured projects");

    console.log("Writing raw.json");
    fs.mkdirSync("generated", { recursive: true });
    fs.writeFileSync("generated/raw.json", JSON.stringify({pages, apiCalls}, null, 2));


    await browser.close();
    return { pages, apiCalls };
}