// Local Storage Service for Campus Credits System

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "student" | "admin" | "canteen";
  nftId: string;
  walletAddress: string;
  credits: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  date: string;
  createdBy: string;
}

const USERS_KEY = "campus_credits_users";
const TRANSACTIONS_KEY = "campus_credits_transactions";
const CURRENT_USER_KEY = "campus_credits_current_user";

// User Management
export const saveUser = (user: User): void => {
  const users = getAllUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getAllUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getUserByEmail = (email: string): User | null => {
  const users = getAllUsers();
  return users.find((u) => u.email === email) || null;
};

export const getUserById = (id: string): User | null => {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
};

export const updateUser = (updatedUser: User): void => {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const deleteUser = (userId: string): void => {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
};

// Transaction Management
export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getAllTransactions();
  transactions.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

  // Update user credits
  const user = getUserById(transaction.userId);
  if (user) {
    user.credits += transaction.amount;
    updateUser(user);
  }
};

export const getAllTransactions = (): Transaction[] => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getUserTransactions = (userId: string): Transaction[] => {
  const transactions = getAllTransactions();
  return transactions.filter((t) => t.userId === userId);
};

// Current User Session
export const setCurrentUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Generate random password
export const generatePassword = (length: number = 8): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Generate NFT ID
export const generateNftId = (): string => {
  const count = getAllUsers().length + 1;
  return `#${String(count).padStart(4, "0")}`;
};

// Generate wallet address
export const generateWalletAddress = (): string => {
  return "0x" + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
};
