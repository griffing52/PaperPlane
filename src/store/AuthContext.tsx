// src/store/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';

import { firebaseAuth } from '../firebase/BaseConfig';
import type { IAuth, LoginFormValues, UserFormValues } from '../interfaces/interfaces';
import { firebaseSignIn, firebaseSignUp, firebaseSignOut } from '../firebase/AuthService';

// simple inline loader to avoid missing import
const PageLoading = () => <div>Loading…</div>;

// default context value must match IAuth exactly
export const AuthContext = createContext<IAuth>({
  user: firebaseAuth.currentUser,
  loading: false,
  signIn: (_creds: LoginFormValues, _onSuccess?: () => void) => {},
  signUp: (_creds: UserFormValues) => {},
  signOut: () => {},
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Sign up
  const signUp = (creds: UserFormValues) => {
    setIsLoading(true);
    firebaseSignUp(creds)
      .then(async (signUpResult) => {
        const { user } = signUpResult;
        if (user) {
          setCurrentUser(user);
          navigate('/dashboard', { replace: true });
        }
      })
      .catch((error) => {
        // handle specific errors if desired
        if (error.code === 'auth/email-already-in-use') {
          // ...
        } else if (error.code === 'auth/too-many-requests') {
          // ...
        }
      })
      .finally(() => setIsLoading(false));
  };

  // Sign in
  const signIn = async (creds: LoginFormValues, onSuccess?: () => void) => {
    setIsLoading(true);
    firebaseSignIn(creds)
      .then((signInResult) => {
        const { user } = signInResult;
        if (user) {
          setCurrentUser(user);
          navigate('/dashboard', { replace: true });
          console.log('Logged in!'); 
          if (onSuccess) onSuccess();
          
        }
      })
      .catch((error) => {
        if (error.code === 'auth/wrong-password') {
          // ...
        } else if (error.code === 'auth/too-many-requests') {
          // ...
        }
      })
      .finally(() => setIsLoading(false));
  };

  // Sign out (not nested, no shadowing)
  const signOut = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut();
      setCurrentUser(null);
      navigate('/signin', { replace: true });
    } catch (error) {
      // optional: handle error
    } finally {
      setIsLoading(false);
    }
  };

  // onAuthStateChanged: hydrate auth state on first load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isAuthLoading) return <PageLoading />;

  const authValues: IAuth = {
    user: currentUser,
    loading: isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
