import { db, storage, auth } from "./firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { StampStyle } from "@/components/StampPreview";

export const uploadStamp = async (
  dataUrl: string, 
  style: StampStyle, 
  metadata: { title: string; location: string; date: string; }
) => {
  if (!auth.currentUser) throw new Error("Vui lòng đăng nhập để lưu tem!");

  const uid = auth.currentUser.uid;
  const fileName = `stamps/${uid}/${Date.now()}.png`;
  const storageRef = ref(storage, fileName);

  // Upload image to Firebase Storage
  await uploadString(storageRef, dataUrl, 'data_url');
  const imageUrl = await getDownloadURL(storageRef);

  // Save metadata to Firestore
  const stampDoc = {
    userId: uid,
    imageUrl,
    style,
    metadata,
    likes: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "stamps"), stampDoc);
  return { id: docRef.id, ...stampDoc };
};

export const getUserStamps = async (userId: string) => {
  const q = query(
    collection(db, "stamps"), 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
