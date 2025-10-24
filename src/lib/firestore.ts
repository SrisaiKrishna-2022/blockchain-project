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
import { getContract, getProvider } from "@/lib/contract";
import { ethers } from "ethers";

// Types matching our Firestore schema
export interface User {
  id: string;
  email: string;
  name: string;
  role: "student" | "admin" | "canteen";
  nftId: string;
  walletAddress: string;
  credits: number;
  showWallet?: boolean;
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
  // Ensure nftId and walletAddress are unique. If provided and collision detected, regenerate.
  let nftIdToUse = userData.nftId;
  if (!nftIdToUse) {
    nftIdToUse = await generateNftId();
  } else {
    // verify uniqueness
    const q = query(usersRef, where("nftId", "==", nftIdToUse));
    const snap = await getDocs(q);
    if (!snap.empty) {
      nftIdToUse = await generateNftId();
    }
  }

  let walletToUse = userData.walletAddress;
  if (!walletToUse) {
    walletToUse = generateWalletAddress();
  } else {
    const q2 = query(usersRef, where("walletAddress", "==", walletToUse));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      // regenerate until unique
      let tries = 0;
      do {
        walletToUse = generateWalletAddress();
        const q3 = query(usersRef, where("walletAddress", "==", walletToUse));
        const snap3 = await getDocs(q3);
        if (snap3.empty) break;
        tries++;
      } while (tries < 10);
    }
  }

  const userWithTimestamp = {
    ...userData,
    createdAt: serverTimestamp(),
    // Ensure all required fields are present
    role: userData.role || "student",
    credits: userData.credits || 0,
    nftId: nftIdToUse,
    walletAddress: walletToUse,
    showWallet: typeof userData.showWallet === 'boolean' ? userData.showWallet : true,
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
      showWallet: typeof data.showWallet === 'boolean' ? data.showWallet : true,
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

// Delete all transaction documents (keeps user credits as-is). Use with caution.
export const deleteAllTransactions = async (): Promise<void> => {
  const snapshot = await getDocs(transactionsRef);
  const deletes: Promise<void>[] = snapshot.docs.map(d => deleteDoc(doc(transactionsRef, d.id)));
  await Promise.all(deletes);
};

// Delete all transactions and reset non-admin user credits to baseline (60 CC)
// then add on-chain balance for each user (if available) so final credits = 60 + onChainBalance
export const deleteAllTransactionsAndResetCredits = async (): Promise<void> => {
  // Delete all transaction documents first
  const snapshot = await getDocs(transactionsRef);
  const deletes: Promise<void>[] = snapshot.docs.map(d => deleteDoc(doc(transactionsRef, d.id)));
  await Promise.all(deletes);

  // Fetch all users and reset credits
  const usersSnap = await getDocs(usersRef);
  const users = usersSnap.docs.map(d => ({ ...d.data(), id: d.id } as User));

  // Prepare contract for reading on-chain balances (read-only provider)
  let contract: ethers.Contract | null = null;
  try {
    contract = getContract(getProvider());
  } catch (err) {
    console.warn("Could not create contract for on-chain reads:", err);
  }

  const updates: Promise<void>[] = users.map(async (u) => {
    if (u.role === "admin") return;

    let onChain = 0;
    try {
      if (contract && u.walletAddress) {
        const bal = await contract.balanceOf(u.walletAddress);
        // ethers BigNumber -> number (may throw if very large)
        onChain = Number(bal?.toString ? bal.toString() : bal) || 0;
      }
    } catch (err) {
      console.warn("Failed to read on-chain balance for", u.walletAddress, err);
    }

    const baseline = u.role === "canteen" ? 100 : 60;
    const newCredits = baseline + onChain;
    const docRef = doc(usersRef, u.id);
    await updateDoc(docRef, { credits: newCredits });
  });

  await Promise.all(updates);
};

// Helper functions (preserved from localStorage version)
export const generateNftId = async (): Promise<string> => {
  // Generate a short random NFT id and ensure it's unique in Firestore.
  // Format: # + 6 hex chars (e.g. #1a2b3c). Loop until a unique id is found.
  while (true) {
    const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    const candidate = `#${rand.toUpperCase()}`;
    const q = query(usersRef, where("nftId", "==", candidate));
    const snap = await getDocs(q);
    if (snap.empty) return candidate;
    // else loop and try again
  }
};

export const generateWalletAddress = (): string => {
  // Generate a random 40-hex-character wallet address. Collision check should be done by caller.
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