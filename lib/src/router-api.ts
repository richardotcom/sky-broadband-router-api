import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";

enum FrequencyBand {
    TWO_POINT_FIVE_GHZ = 1,
    FIVE_GHZ = 2
}

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
     * 
     * @param band Enum corresponding to selected frequency band.
     * @param enable Turn on or off wireless connectivity for specified band.
     * 
     * @returns {boolean}
     * True if the band was turned on or off as desired.
     */
    private async toggleWiFi(band: FrequencyBand, enable: boolean): Promise<boolean> {
        // Retrieve cross-site request forgery prevention token
        const cookies = await this.cookieJar.getCookies(Router.baseURL);

        let csrfpToken: string = String();
        // Likely to be the last cookie in the list.
        for (let i = cookies.length - 1; i >= 0; i--) {
            if (cookies[i].key == "csrfp_token") {
                csrfpToken = cookies[i].value;
                break;
            }
        }

        if (!csrfpToken) {
            throw new Error("Authentication error, cookie with key csrfp_token missing");
        }

        // URL-encoded configuration
        const configInfo = encodeURIComponent(JSON.stringify({
            "ssid_number": band,
            "radio_enable": enable.toString()
        }));
        
        // Request configuration update
        const response = await this.client.postForm("/actionHandler/ajaxSet_wireless_network_configuration_edit.jst", {
            "configInfo": configInfo,
            "csrfp_token": csrfpToken // Needs to be included as body parameter for some reason.
        },
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        // TODO: Implement better validation, because "success" does not necessarily mean that changes were applied.
        if (response.data == "success") {
            return true;
        }
        return false;
    }

    /**
     * Turn on or off wireless connectivity.
     * 
     * @param enable Set to true to turn on, false otherwise.
     * 
     * @remarks
     * Errors need to be handled by the user.
     */
    public async toggleWifi(enable: boolean) {
        const [two_point_five_ghz, five_ghz] = await Promise.all([
            this.toggleWiFi(FrequencyBand.TWO_POINT_FIVE_GHZ, enable),
            this.toggleWiFi(FrequencyBand.FIVE_GHZ, enable)
        ]);

        if (!two_point_five_ghz && !five_ghz) {
            throw new Error("Failed to turn " + enable ? "on" : "off" + " WiFi.");
        }
        // TODO: Consider recovery options when one band fails to switch.
        else if (!two_point_five_ghz) {
            throw new Error("Issue with 2.4GHz band.");
        }
        else if (!five_ghz) {
            throw new Error("Issue with 5GHz band.");
        }
    }
}
