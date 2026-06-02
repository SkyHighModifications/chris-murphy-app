/**
 * Application entry — logic lives in modules/ and renderer/app.js.
 */
import { initApp } from "./app.js";

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
