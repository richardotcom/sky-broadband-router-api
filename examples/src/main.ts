import path from "path";
import fs from "fs";
import dotenv from "dotenv"
import { Router } from "../../lib/src/router-api";

function sleep(milliseconds: number, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            signal.removeEventListener("abort", handleAbort);
            resolve();
        }, milliseconds);

        const abort = (message: string) => {
            clearTimeout(timeout);
            signal.removeEventListener("abort", handleAbort);
            reject(new Error(message));
        }

        const handleAbort = (event: Event) => {
            abort((event.target as AbortSignal).reason);
        };
        
        // Listen for abort signal
        signal.addEventListener("abort", handleAbort);

        // Just in case the signal gets aborted before the event listener is added
        if (signal.aborted) {
            abort(signal.reason);
        }
    });
}

function calculateTimeUntil(hours: number): number {
    const now = new Date();
    const futureTime = new Date(now);
    // If the hour has passed, it will shift to the following day.
    futureTime.setHours(now.getHours() < hours ? hours : hours + 24, 0, 0, 0);
    return futureTime.getTime() - now.getTime();
}

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
    .then(async router => {
        const controller = new AbortController();
        // Handles Ctrl+C press
        process.on('SIGINT', () => {
            controller.abort("Keyboard interrupt detected");
        });

        while (!controller.signal.aborted) {
            // Turn off at midnight
            await sleep(calculateTimeUntil(24), controller.signal);
            router.toggleWifi(false);

            // Turn back on at 6am or if the process gets interrupted
            await sleep(calculateTimeUntil(6), controller.signal)
            .finally(() => {
                router.toggleWifi(true);
            });
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
