

export interface LoginFormValues {
 email: string;
 password: string;
}

export interface UserFormValues {
 email: string;
 password: string;
 displayName: string;
}

//IAuth context
export  interface  IAuth {
user:  User  |  null;  //type User comes from firebase
loading:  boolean;
signIn: (creds:  LoginFormValues) =>  void;
signUp: (creds:  UserFormValues) =>  void;
signOut: () =>  void;
}