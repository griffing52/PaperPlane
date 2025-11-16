'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

export default function SignUpPage() {
  const router = useRouter();
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

    try {
      await createUserWithEmailAndPassword(auth, email, passwordOne);
      console.log('User created successfully');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-semibold mb-6 text-center">Sign Up</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          id="email"
          data-testid="signup-email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <input
          id="password"
          data-testid="signup-password"
          placeholder="Password"
          value={passwordOne}
          onChange={(e) => setPasswordOne(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          data-testid="confirm-password"
          value={passwordTwo}
          onChange={(e) => setPasswordTwo(e.target.value)}
          className="border w-full p-2 rounded"
        />
        <button type="submit" data-testid="submit-button" className="w-full bg-blue-600 text-white py-2 rounded">
          Create Account
        </button>
      </form>
    </main>
  );
}
