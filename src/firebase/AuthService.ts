//imports
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { firebaseAuth } from './BaseConfig';
import type { LoginFormValues, UserFormValues } from '../interfaces/interfaces';

//required if you want to keep logged in after user exits the browser or closes tab
setPersistence(firebaseAuth,  browserLocalPersistence);

//Sign in functionality
export const firebaseSignIn = async ({ email, password }: LoginFormValues) => {
 const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
 return result;
};

//Sign up functionality
export const firebaseSignUp = async ({ email, password }: UserFormValues) => {
 const  result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
 return result;
};

//Sign out functionality
export const  firebaseSignOut  =  async () => {
 await  signOut(firebaseAuth);
};