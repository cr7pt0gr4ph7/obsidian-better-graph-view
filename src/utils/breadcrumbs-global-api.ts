import { BCAPI } from "src/utils/breadcrumbs-api";

declare global {
    interface Window {
        BCAPI: BCAPI;
    }
}
