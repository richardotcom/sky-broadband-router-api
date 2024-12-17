import path from "path";
import fs from "fs";
import dotenv from "dotenv"
import { Router } from "../../lib/src/router-api";

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function main() {
    const envPath: string = path.resolve(__dirname, "../../.env");
    if (!fs.existsSync(envPath)) {
        console.error("File " + envPath + " does not exist");
    }

    dotenv.config({ path: envPath });
    const password: string = process.env.PASSWORD || String();
    if (!password) {
        console.error("Password not set inside .env file");
    }

    Router.getInstance(password)
    .then(async router => {
        while (true) {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const timeUntilMidnight = midnight.getTime() - now.getTime();

            // Turn off at midnight.
            await sleep(timeUntilMidnight);
            router.toggleWifi(false);

            // Turn back on at 6am.
            await sleep(21600000);
            router.toggleWifi(true);
        }
    })
    .catch(error => {
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error("An unknown error occurred");
        }
    });
}

main();
