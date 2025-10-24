import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/pages/firebaseconfig";
import {
  User,
  saveUser,
  getUserById,
  getUserByEmail,
  generateNftId,
  generateWalletAddress,
} from "@/lib/firestore";

interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, name: string, role: User["role"]) => Promise<{ success: boolean; error?: string }>;
  // createUserByAdmin: client-side creates a Firestore profile for a new user. In production,
  // use a Cloud Function with admin privileges to create Auth users without signing out the admin.
  createUserByAdmin: (email: string, password: string, name: string, role: User["role"]) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  // Change password for currently signed-in user. Requires current password.
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // Password reset via email removed from client API
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to Firebase auth state
    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        setUser(null);
        return;
      }

      // Load profile from Firestore
      const existingUser = await getUserById(fbUser.uid);
      if (existingUser) {
        setUser(existingUser);
      }
    });

    return () => unsub();
  }, []);


  const signup = async (email: string, password: string, name: string, role: User["role"]) => {
    try {
      // First create the Firebase auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Then create the user profile in Firestore using the Firebase UID
      const userProfile = {
        id: cred.user.uid, // Use Firebase UID as document ID
        email,
        name,
        role,
        nftId: await generateNftId(),
        walletAddress: generateWalletAddress(),
        credits: role === "student" ? 60 : role === "canteen" ? 100 : 0,
        showWallet: true,
      };
      
      // Save user with specific ID
      const newUser = await saveUser(userProfile);
      setUser(newUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Signup failed" };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Starting login process");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase auth successful, uid:", cred.user.uid);
      
      // Wait briefly to ensure Firestore is updated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Explicitly fetch user data after successful login
      let userData = await getUserById(cred.user.uid);
      console.log("First attempt fetching user data:", userData);
      
      // If user data is not found, try fetching by email as fallback
      if (!userData) {
        console.log("User data not found by ID, trying email...");
        userData = await getUserByEmail(email);
        console.log("Email lookup result:", userData);
      }
      
      if (!userData) {
        console.error("No user data found for uid:", cred.user.uid);
        // Create a basic user profile if none exists
        userData = await saveUser({
          id: cred.user.uid,
          email: cred.user.email || email,
          name: cred.user.displayName || email.split('@')[0],
          role: "student", // Default role
          nftId: await generateNftId(),
          walletAddress: generateWalletAddress(),
          credits: 60,
          showWallet: true,
        });
        console.log("Created new user profile:", userData);
      }
      
      setUser(userData);
      console.log("User data set in context:", userData);
      return { success: true, user: userData };
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, error: err.message || "Login failed" };
    }
  };

  // resetPassword removed: password reset by email is intentionally not provided in this client

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser || !fbUser.email) {
        return { success: false, error: "No authenticated user" };
      }

      // Reauthenticate with current password
      const cred = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);

      // Update password
      await updatePassword(fbUser, newPassword);
      return { success: true };
    } catch (err: any) {
      console.error("changePassword error:", err);
      return { success: false, error: err.message || "Change password failed" };
    }
  };

  // Note: In production:
  // 1. Use Firebase Custom Claims to store admin role (https://firebase.google.com/docs/auth/admin/custom-claims)
  // 2. Create a Cloud Function to handle admin user creation with proper security
  // 3. Use Security Rules to restrict Firestore access based on Custom Claims
  const createUserByAdmin = async (email: string, password: string, name: string, role: User["role"]) => {
    try {
      // This uses the same client-side createUser; in production use a callable Cloud Function with admin privileges.
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      
      const newUser = await saveUser({
        id: uid,
        email,
        name,
        role,
        nftId: await generateNftId(),
        walletAddress: generateWalletAddress(),
        credits: role === "student" ? 60 : role === "canteen" ? 100 : 0,
        showWallet: true,
      });
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Create user failed" };
    }
  };

  const logout = () => {
    firebaseSignOut(auth).then(() => {
      setUser(null);
      navigate("/auth");
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        createUserByAdmin,
        logout,
        changePassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
 };
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
