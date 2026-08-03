import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, "admin123@gmail.temsy", "admintemsy123");
    const uid = userCredential.user.uid;
    console.log("Created Auth user:", uid);
    
    await setDoc(doc(db, "users", uid), {
      uid: uid,
      name: "Temsy Admin",
      email: "admin123@gmail.temsy",
      avatar: null,
      joinDate: new Date().toISOString(),
      stats: { stamps: 0, albums: 0, followers: 0, following: 0 },
      role: "admin",
      title: "Chúa Tể Hệ Thống"
    });
    console.log("Created Firestore document with admin role!");
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("User already exists. Skipping creation.");
    } else {
      console.error(error);
      process.exit(1);
    }
  }
}
run();
