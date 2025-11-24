import { setWorldConstructor, World } from "@cucumber/cucumber";
import { Browser, Page, chromium } from "playwright";

export class TestWorld extends World {
  browser!: Browser;
  page!: Page;

  async init() {
    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext();
    this.page = await context.newPage();
  }

  async close() {
    await this.browser.close();
  }
}

setWorldConstructor(TestWorld);
