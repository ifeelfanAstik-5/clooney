import { extract } from './extract'
import readLine from 'readline'


const waitForEnter = async ()=>{
    const rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise<void>((resolve)=>{
        rl.question("Press Enter after logging in...", ()=>{
            rl.close();
            resolve();
        })
    })
}


const run = async () => {
    console.log("started");

    const context = await extract(waitForEnter);

    console.log("Extraction complete", Object.keys(context.pages));
}


run();