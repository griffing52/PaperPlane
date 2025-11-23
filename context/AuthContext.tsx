// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/firebase";

type AuthContextType = {
  user: User | null;
  emailHash: string;
  loading: boolean;
};

const hashEmail = async (email: string): Promise<string> => {
  const byteHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#examples
  const hashArray = Array.from(new Uint8Array(byteHash)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

const AuthContext = createContext<AuthContextType>({ user: null, emailHash: "", loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailHash, setEmailHash] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u ?? null);
      setLoading(false);
      if (u?.email) {
        setEmailHash(await hashEmail(u.email));
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, emailHash, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
