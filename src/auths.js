import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./firebase";   

const provider = new GoogleAuthProvider();

export function googleLogin() {
  return signInWithPopup(auth, provider);
}