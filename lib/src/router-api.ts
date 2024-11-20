import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";

export class Router {
    // Singleton
    private static instance: Router;

    // HTTP client
    private client: AxiosInstance;

    // Router details
    private ssid: string = String();
    private password: string = String();

    private constructor() {
        // Retain authentication cookies between requests
        const jar = new CookieJar();
        const axiosInstance = axios.create({
            baseURL: "https://myrouter.io",
            jar
        });
        this.client = wrapper(axiosInstance);
    }

    /**
     * @returns {Router}
     * An instance of `Router`.
     * 
     * @remarks
     * Authentication may throw errors which need to be handled by the user.
     */
    public static async getInstance(password: string): Promise<Router> {
        if (!Router.instance) {
            Router.instance = new Router();

            // Authenticate
            const response = await Router.instance.client.postForm<string>("/check.jst", {
                username: "admin",
                password
            });

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

            //Store details
            if (ssidElement.next()) {
                Router.instance.ssid = ssidElement.next().text();
            }

            const passwordElement = $("#wifipass");
            if (passwordElement.length && passwordElement.next())
            {
                Router.instance.password = passwordElement.next().text();
            }
        }

        return Router.instance;
    }

    /**
     * @returns {string}
     * SSID as a string.
     */
    public getSSID(): string {
        return this.ssid;
    }

    /**
     * @returns {string}
     * Password of the WiFi in plaintext.
     */
    public getWiFiPassword(): string {
        return this.password;
    }
}
