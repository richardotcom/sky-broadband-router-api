import dotenv from "dotenv"
import axios from "axios";
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

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
    client.postForm("/check.jst", {
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
