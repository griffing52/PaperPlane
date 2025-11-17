"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/firebase";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Signed out successfully");
      router.replace("/login");
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  return (
    <button onClick={handleLogout} className="border rounded px-3 py-2">
      Logout
    </button>
  );
}
