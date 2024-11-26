import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";

export class Router {
    // Singleton
    private static instance: Router;

    // Static variables
    private static baseURL: string = "https://myrouter.io";

    // HTTP client
    private cookieJar = new CookieJar();
    private client: AxiosInstance;

    // Router details
    private ssid: string = String();
    private password: string = String();

    private constructor() {
        // Retain authentication cookies between requests
        const axiosInstance = axios.create({
            baseURL: Router.baseURL,
            jar: this.cookieJar
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

    /**
     * Turn on or off wireless connectivity.
     */
    private async toggleWiFi() {
        // Retrieve cross-site request forgery prevention token
        const cookies = await this.cookieJar.getCookies(Router.baseURL);

        let csrfpToken: string = String();
        cookies.forEach(cookie => {
            if (cookie.key == "csrfp_token") {
                csrfpToken = cookie.value;
                return;
            }
        });

        if (!csrfpToken) {
            throw new Error("Authentication error, cookie with key csrfp_token missing");
        }

        // URL-encoded configuration
        const configInfo = encodeURIComponent(JSON.stringify({
            "ssid_number": "1", // 1 | 2
            "radio_enable": "false"
        }));
        
        // Request configuration update
        const response = await this.client.postForm("/actionHandler/ajaxSet_wireless_network_configuration_edit.jst", {
            "configInfo": configInfo,
            "csrfp_token": csrfpToken
        },
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
    }
}
