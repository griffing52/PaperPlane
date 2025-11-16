// features/support/world.ts
import { setWorldConstructor } from "@cucumber/cucumber";
import { MockFirebaseAuth } from "../../tests/mocks/firebaseAuthMock";

class CustomWorld {
  firebase: any;
  result: any;
  error: any;
  currentPage: string;
  loggedIn: boolean;

  constructor() {
    this.firebase = new MockFirebaseAuth();
    this.result = null;
    this.error = null;
    this.currentPage = "/";
    this.loggedIn = false;
  }
}

setWorldConstructor(CustomWorld);
