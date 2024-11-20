import path from "path";
import fs from "fs";
import dotenv from "dotenv"
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
        console.log("SSID:", router.getSSID());
        console.log("WiFi password:", router.getWiFiPassword());
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
