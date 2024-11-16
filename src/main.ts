import dotenv from "dotenv"
import axios from "axios";
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import * as cheerio from "cheerio";

function main(): void {
    dotenv.config();

    const password: string = process.env.PASSWORD || String();
    if (!password) {
        console.error('Password not set inside .env file or .env file missing');
        return;
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
        const ssid_element = $("#wifissid");
        if (!ssid_element.length)
        {
            // Extract error message from alert call embedded inside HTML script
            const alert = response.data.match(/(?<=alert\().+(?=\);)/);
            if (alert) {
                const message = alert[0].matchAll(/\"(.*?)\"/g);
                if (message) {
                    console.error([...message].map(match => match[1]).join(""));
                    return;
                }
            }
            
            console.error("Unknown error");
            return;
        }

        console.log("SSID:", $("#wifissid").next().text());
        console.log("WiFi password:", $("#wifipass").next().text());
    })
    .catch(error => {
        console.error(error);
    });
}

main();
