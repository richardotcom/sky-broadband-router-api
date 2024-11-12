import dotenv from "dotenv"
import axios from "axios";
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const base_url: string = "https://myrouter.io";

// Retain cookies between requests
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

function main(): void {
    dotenv.config();

    const password: string = process.env.PASSWORD || String();
    if (!password) {
        console.error('Password not set inside .env file or .env file missing');
        return;
    }

    // Authentication
    client.postForm(base_url + "/check.jst", {
        username: "admin",
        password
    })
    .then(response => {
        console.log(response.status);
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });
}

main();
