import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/pages/firebaseconfig";

// Types matching our Firestore schema
export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin" | "canteen";
  nftId: string;
  walletAddress: string;
  credits: number;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  date: Timestamp;
  createdBy: string;
}

// Collection references
const usersRef = collection(db, "users");
const transactionsRef = collection(db, "transactions");

// User Management
export const saveUser = async (user: Omit<User, "createdAt"> & { id: string }): Promise<User> => {
  // Create a clean version of user data for Firestore
  const { id, ...userData } = user;
  const userWithTimestamp = {
    ...userData,
    createdAt: serverTimestamp(),
    // Ensure all required fields are present
    role: userData.role || "student",
    credits: userData.credits || 0,
    nftId: userData.nftId || await generateNftId(),
    walletAddress: userData.walletAddress || generateWalletAddress(),
  };
  
  const docRef = doc(usersRef, id);
  await setDoc(docRef, userWithTimestamp);
  
  return {
    ...user,
    createdAt: Timestamp.now(),
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { ...doc.data(), id: doc.id } as User;
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    console.log("Fetching user with ID:", id);
    const docRef = doc(usersRef, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      console.log("No user document found for ID:", id);
      return null;
    }
    
    const data = snapshot.data();
    console.log("Found user data:", data);
    
    // Ensure all required fields are present in the returned data
    const userData: User = {
      id: snapshot.id,
      email: data.email || "",
      name: data.name || "",
      role: data.role || "student",
      nftId: data.nftId || "",
      walletAddress: data.walletAddress || "",
      credits: data.credits || 0,
      createdAt: data.createdAt || Timestamp.now(),
    };
    
    console.log("Processed user data:", userData);
    return userData;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
  const { id, ...userData } = updatedUser;
  const docRef = doc(usersRef, id);
  await updateDoc(docRef, userData);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const docRef = doc(usersRef, userId);
  await deleteDoc(docRef);
};

// Transaction Management
export const saveTransaction = async (transaction: Omit<Transaction, "id">): Promise<Transaction> => {
  // First create the transaction
  const transactionWithTimestamp = {
    ...transaction,
    date: serverTimestamp(),
  };
  const docRef = await addDoc(transactionsRef, transactionWithTimestamp);
  
  // Then update user credits
  const user = await getUserById(transaction.userId);
  if (user) {
    await updateUser({
      ...user,
      credits: user.credits + transaction.amount,
    });
  }

  return {
    ...transaction,
    id: docRef.id,
    date: Timestamp.now(),
  };
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const snapshot = await getDocs(transactionsRef);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const q = query(transactionsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
};

// Helper functions (preserved from localStorage version)
export const generateNftId = async (): Promise<string> => {
  const users = await getAllUsers();
  const count = users.length + 1;
  return `#${String(count).padStart(4, "0")}`;
};

export const generateWalletAddress = (): string => {
  return "0x" + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
};

// Note: In production, use Firebase Custom Claims instead of checking the role field
// https://firebase.google.com/docs/auth/admin/custom-claims
export const isAdmin = async (userId: string): Promise<boolean> => {
  const user = await getUserById(userId);
  return user?.role === "admin";
};

export const hasAnyAdmin = async (): Promise<boolean> => {
  const q = query(usersRef, where("role", "==", "admin"));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};