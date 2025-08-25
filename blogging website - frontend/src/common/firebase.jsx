import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA0OTlyS5B0utEHX23Oq1lANXfm6Xo-6Lc",
  authDomain: "blog-website-992fe.firebaseapp.com",
  projectId: "blog-website-992fe",
  storageBucket: "blog-website-992fe.firebasestorage.app",
  messagingSenderId: "551861726362",
  appId: "1:551861726362:web:1ff92de6693df6542d0323",
  measurementId: "G-CW7RSB6G4N"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// google auth

const provider = new GoogleAuthProvider()

const auth = getAuth();

export const authWithGoogle = async () => {
    let user = null;

    await signInWithPopup(auth,provider)
    .then((result) => {
        user = result.user;
    })
    .catch((err) => {
        console.log(err)
    })

    return user;
}