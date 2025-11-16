// tests/mocks/firebaseAuthMock.ts
export class MockFirebaseAuth {
  private users: Record<string, { email: string; password: string }> = {};

  constructor() {
    // Seed an existing user so scenarios like “email already exists” work
    this.users["test@example.com"] = {
      email: "test@example.com",
      password: "CorrectPassword123",
    };
  }

  validateEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  async createUserWithEmailAndPassword(email: string, password: string) {
    if (!this.validateEmail(email)) {
      throw { code: "auth/invalid-email" };
    }

    if (password.length < 6) {
      throw { code: "auth/weak-password" };
    }

    if (this.users[email]) {
      throw { code: "auth/email-already-in-use" };
    }

    this.users[email] = { email, password };
    return { user: { email } };
  }

  async signInWithEmailAndPassword(email: string, password: string) {
    const user = this.users[email];

    if (!user) {
      throw { code: "auth/user-not-found" };
    }

    if (user.password !== password) {
      throw { code: "auth/wrong-password" };
    }

    return { user };
  }

  async signOut() {
    return true;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    callback(null); // start in logged-out state
  }
}
