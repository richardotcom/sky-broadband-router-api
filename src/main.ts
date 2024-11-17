import path from "path";
import fs from "fs";
import dotenv from "dotenv"
import axios from "axios";
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import * as cheerio from "cheerio";

try {
    const envPath: string = path.resolve(__dirname, "../.env");
    if (!fs.existsSync(envPath)) {
        throw new Error("File " + envPath + " does not exist");
    }

    dotenv.config({ path: envPath });
    const password: string = process.env.PASSWORD || String();
    if (!password) {
        throw new Error("Password not set inside .env file");
    }

    // Retain cookies between requests
    const jar = new CookieJar();
    const axiosInstance = axios.create({
        baseURL: "https://myrouter.io",
        jar
    });
    const client = wrapper(axiosInstance);

    // Authentication
    client.postForm<string>("/check.jst", {
        username: "admin",
        password
    })
    .then(response => {
        // Parse received HTML to assess success
        const $ = cheerio.load(response.data);

        const ssidElement = $("#wifissid");
        if (!ssidElement.length)
        {
            // Extract error message from alert call embedded inside HTML script
            const alert = response.data.match(/(?<=alert\().+(?=\);)/);
            if (alert) {
                const message = alert[0].matchAll(/\"(.*?)\"/g);
                if (message) {
                    throw new Error([...message].map(match => match[1]).join(""));
                }
            }
            
            throw new Error("Unknown error");
        }
        if (ssidElement.next()) {
            console.log("SSID:", ssidElement.next().text());
        }

        const passwordElement = $("#wifipass");
        if (passwordElement.length && passwordElement.next())
        {
            console.log("WiFi password:", passwordElement.next().text());
        }
    })
}
catch (error) {
    console.error(error);
}
