import path from "path";
import fs from "fs";
import dotenv from "dotenv"
import * as router from "../../lib/src/router-api";

try {
    const envPath: string = path.resolve(__dirname, "../../.env");
    if (!fs.existsSync(envPath)) {
        throw new Error("File " + envPath + " does not exist");
    }

    dotenv.config({ path: envPath });
    const password: string = process.env.PASSWORD || String();
    if (!password) {
        throw new Error("Password not set inside .env file");
    }

    router.Authenticate(password);
}
catch (error: unknown) {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error("An unknown error occurred");
    }
}
