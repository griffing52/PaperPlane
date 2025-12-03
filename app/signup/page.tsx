'use client';

import Image from "next/image";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { createBackendUser } from '../../lib/backendUser';
import { BrandLogo } from "@/components/BrandLogo";

export default function SignUpPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordOne, setPasswordOne] = useState('');
  const [passwordTwo, setPasswordTwo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordOne !== passwordTwo) {
      setError('Passwords do not match');
      return;
    }

    if (!firstName || !lastName) {
      setError('Please enter both first and last name');
      return;
    }

    if (!firstName || !lastName) {
      setError('Please enter both first and last name');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        passwordOne
      );

      const user = userCredential.user;
      const fullName = `${firstName} ${lastName}`;

      // Update Firebase user object
      await updateProfile(user, { displayName: fullName });

      const idToken = await user.getIdToken();

      // Send to backend
      await createBackendUser(idToken, fullName);

      router.push('/login');

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen text-white">
      <Image
        src="/signup-bg.jpg"
        alt="Airplane background"
        fill
        priority
        className="object-cover -z-20"
      />
      <div className="absolute inset-0 bg-black/60 -z-10" />

      <BrandLogo href="/" />

      <main className="flex items-center justify-center px-4 pb-16 min-h-[70vh]">
        <div className="w-full max-w-md rounded-md bg-black/60 border border-white/10 px-8 py-10 shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-semibold mb-6 text-center">Sign Up</h1>

          {error && (
            <p data-testid="signup-error" className="text-red-500 text-center mb-4">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">

            <input
              id="first-name"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border border-neutral-700 w-full p-2 rounded bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              id="last-name"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-neutral-700 w-full p-2 rounded bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              id="email"
              data-testid="signup-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-neutral-700 w-full p-2 rounded bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              id="password"
              data-testid="signup-password"
              type="password"
              placeholder="Password"
              value={passwordOne}
              onChange={(e) => setPasswordOne(e.target.value)}
              className="border border-neutral-700 w-full p-2 rounded bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              id="confirm-password"
              data-testid="signup-confirm"
              type="password"
              placeholder="Confirm Password"
              value={passwordTwo}
              onChange={(e) => setPasswordTwo(e.target.value)}
              className="border border-neutral-700 w-full p-2 rounded bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              data-testid="signup-button"
              disabled={!email || !passwordOne || !passwordTwo || !firstName || !lastName}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              Create Account
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
