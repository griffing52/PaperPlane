import { Before, After } from "@cucumber/cucumber";
import { chromium } from "playwright";
import { setDefaultTimeout } from "@cucumber/cucumber";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

Before(async function () {
  this.browser = await chromium.launch();
  this.context = await this.browser.newContext({ baseURL: BASE_URL });
  this.page = await this.context.newPage();
});

After(async function () {
  await this.browser.close();
});
