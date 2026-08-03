import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { UserProfile } from "./userService";

export const searchUserByShortUid = async (shortUid: string): Promise<UserProfile | null> => {
  if (!shortUid || shortUid.length < 4) return null;
  
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    
    // Tìm user có uid kết thúc bằng shortUid
    for (const doc of snapshot.docs) {
      if (doc.id.endsWith(shortUid)) {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          displayName: data.displayName || data.name || "Người dùng ẩn danh",
          photoURL: data.photoURL || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
        } as UserProfile;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Lỗi tìm kiếm người dùng:", error);
    return null;
  }
};

export const addFriend = async (currentUid: string, targetUid: string): Promise<boolean> => {
  try {
    const currentUserRef = doc(db, "users", currentUid);
    const targetUserRef = doc(db, "users", targetUid);
    
    // Check friend count limit (20)
    const currentUserSnap = await getDoc(currentUserRef);
    if (currentUserSnap.exists()) {
      const friends = currentUserSnap.data().friends || [];
      if (friends.length >= 20) {
        throw new Error("Bạn đã đạt giới hạn tối đa 20 bạn bè.");
      }
      if (friends.includes(targetUid)) {
        throw new Error("Người này đã là bạn bè của bạn.");
      }
    }
    
    // Add to each other's friend lists
    await updateDoc(currentUserRef, {
      friends: arrayUnion(targetUid)
    });
    
    await updateDoc(targetUserRef, {
      friends: arrayUnion(currentUid)
    });
    
    return true;
  } catch (error) {
    console.error("Lỗi khi kết bạn:", error);
    throw error;
  }
};

export const getFriends = async (uid: string): Promise<UserProfile[]> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const friendsIds: string[] = userSnap.data().friends || [];
      
      if (friendsIds.length === 0) return [];
      
      const friendsProfiles: UserProfile[] = [];
      
      // Fetch each friend's profile
      // For small arrays (<= 20), Promise.all is fine
      await Promise.all(
        friendsIds.map(async (friendId) => {
          const friendDoc = await getDoc(doc(db, "users", friendId));
          if (friendDoc.exists()) {
            const data = friendDoc.data();
            friendsProfiles.push({
              uid: friendDoc.id,
              ...data,
              displayName: data.displayName || data.name || "Người dùng ẩn danh",
              photoURL: data.photoURL || data.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
            } as UserProfile);
          }
        })
      );
      
      return friendsProfiles;
    }
    
    return [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè:", error);
    return [];
  }
};

export const removeFriend = async (currentUid: string, targetUid: string): Promise<boolean> => {
  try {
    const currentUserRef = doc(db, "users", currentUid);
    const targetUserRef = doc(db, "users", targetUid);
    
    await updateDoc(currentUserRef, {
      friends: arrayRemove(targetUid)
    });
    
    await updateDoc(targetUserRef, {
      friends: arrayRemove(currentUid)
    });
    
    return true;
  } catch (error) {
    console.error("Lỗi khi hủy kết bạn:", error);
    throw error;
  }
};
