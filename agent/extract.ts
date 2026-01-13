import { chromium } from 'playwright'
import fs from 'fs'
import { extractRenderedTree } from './utils';

const actionLog: any[] = [];


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

    const capture = async (name: string, action?: string) =>{
        console.log("Starting capture:", name, action);
        // const html = await page.evaluate(()=>{ document.documentElement.outerHTML });
        // pages[name] = { html };
        apiCalls.length = 0; // Clear previous API calls

        const tree = await extractRenderedTree(page);
        
        pages[name] = { action,tree, apiCalls: [...apiCalls] };
        console.log("Captured", name);
    }

    console.log("Starting capture: home");
    await capture("home");
    console.log("Captured home");

    await page.goto("https://app.asana.com/0/home");

    console.log("Starting capture: projects");
    await capture("projects");
    console.log("Captured projects");

    console.log("Performing ADD_TASK action");
    

    //---------------------------------------------------
    await capture("projects_before_add_task", "BEFORE_ADD_TASK");

    console.log("Performing ADD_TASK action");

    // Click "Create task" button
    await page.click('text=Create task');

    // Type task name
    const taskTitle = "Agent test task";
    
    actionLog.push({
        action: "ADD_TASK",
        input: {
            title: taskTitle
        }
    });
    await page.keyboard.type(taskTitle);


    // Confirm
    await page.keyboard.press('Enter');

    // Wait for Asana to finish its internal update cycle
    await page.waitForLoadState('networkidle');

    // Extra short buffer for React reconciliation
    await page.waitForTimeout(300);


    await capture("projects_after_add_task", "ADD_TASK");


    //---------------------------------------------------
    await capture("projects_before_delete_task", "BEFORE_DELETE_TASK");

    // Select the task again (fresh DOM)
    await page.click(`text=${taskTitle}`, { timeout: 10000 });
    await page.waitForTimeout(200);

    // Delete via keyboard (preferred)
    await page.keyboard.press('Delete');
    await page.keyboard.press('Enter');

    actionLog.push({
        action: "DELETE_TASK",
        input: {
            title: taskTitle
        }
    });

    // Wait for UI to settle after deletion
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    await capture("projects_after_delete_task", "DELETE_TASK");


    await capture("projects_after_delete_task", "DELETE_TASK");

    console.log("Writing raw.json");
    fs.mkdirSync("generated", { recursive: true });
    fs.writeFileSync("generated/raw.json", JSON.stringify({pages, apiCalls, actionLog}, null, 2));

    // await browser.close();
    return { pages, apiCalls };
}