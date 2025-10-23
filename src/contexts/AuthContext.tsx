import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Role = "student" | "admin" | "canteen";

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  walletAddress: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: Role) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("campusCreditsUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const generateWalletAddress = () => {
    return "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  };

  const signup = async (email: string, password: string, name: string, role: Role) => {
    // Get existing users
    const usersData = localStorage.getItem("campusCreditsUsers");
    const users = usersData ? JSON.parse(usersData) : [];

    // Check if user already exists
    if (users.find((u: any) => u.email === email)) {
      return { success: false, error: "User already exists" };
    }

    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      role,
      walletAddress: generateWalletAddress(),
    };

    // Store password separately (in production, this should be hashed)
    users.push({ ...newUser, password });
    localStorage.setItem("campusCreditsUsers", JSON.stringify(users));

    // Log in the user
    setUser(newUser);
    localStorage.setItem("campusCreditsUser", JSON.stringify(newUser));

    return { success: true };
  };

  const login = async (email: string, password: string) => {
    const usersData = localStorage.getItem("campusCreditsUsers");
    const users = usersData ? JSON.parse(usersData) : [];

    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (!foundUser) {
      return { success: false, error: "Invalid email or password" };
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem("campusCreditsUser", JSON.stringify(userWithoutPassword));

    return { success: true };
  };

  const resetPassword = async (email: string, newPassword: string) => {
    const usersData = localStorage.getItem("campusCreditsUsers");
    const users = usersData ? JSON.parse(usersData) : [];

    const userIndex = users.findIndex((u: any) => u.email === email);

    if (userIndex === -1) {
      return { success: false, error: "Email not found" };
    }

    users[userIndex].password = newPassword;
    localStorage.setItem("campusCreditsUsers", JSON.stringify(users));

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("campusCreditsUser");
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        resetPassword,
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
