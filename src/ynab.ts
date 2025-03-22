import * as ynab from "ynab";

export const api = new ynab.API(process.env.YNAB_API_TOKEN || "");