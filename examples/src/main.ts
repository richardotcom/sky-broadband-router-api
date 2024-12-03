import path from "path";
import fs from "fs";
import dotenv from "dotenv"
import timersPromises from 'node:timers/promises'
import { Router } from "../../lib/src/router-api";

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
    .then(router => {
        while (true) {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const timeUntilMidnight = midnight.getTime() - now.getTime();

            // Turn off at midnight.
            timersPromises.setTimeout(timeUntilMidnight);
            router.toggleWifi(false);

            // Turn back on at 6am.
            timersPromises.setTimeout(21600000);
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
