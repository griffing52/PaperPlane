import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { BrowserContext, Page, PlaywrightTestOptions } from '@playwright/test';

// 1. Define the interface so TypeScript knows 'this.lastPassword' exists
export interface ICustomWorld extends World {
  context?: BrowserContext;
  page: Page;
  testOptions?: PlaywrightTestOptions;
  
  // Custom variables to share data between steps
  existingEmail?: string;
  lastPassword?: string;
}

// 2. Implement the class
export class CustomWorld extends World implements ICustomWorld {
  context?: BrowserContext;
  page!: Page;
  testOptions?: PlaywrightTestOptions;

  // Initialize them as undefined
  existingEmail?: string;
  lastPassword?: string;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);