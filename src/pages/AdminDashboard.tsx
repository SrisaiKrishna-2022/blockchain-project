import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Users, History, Settings } from "lucide-react";
import { User, Transaction, getAllUsers, getAllTransactions, saveTransaction } from "@/lib/firestore";
import { mintCredits } from "@/lib/contract";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, createUserByAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Create user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("student");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate(`/${user?.role || "auth"}`);
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedUsers, fetchedTransactions] = await Promise.all([
          getAllUsers(),
          getAllTransactions(),
        ]);
        setUsers(fetchedUsers);
        setTransactions(fetchedTransactions.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 10));
      } catch (error) {
        toast.error("Failed to load dashboard data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleSendRandomCredit = async (toUser: User) => {
    try {
      const amount = Math.floor(Math.random() * 50) + 1; // 1..50
      const reasons = ["Attendance", "Exam Bonus", "Event", "Referral", "Good Behaviour"];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];

      // Attempt to mint credits on-chain (requires admin wallet connected and contract deployed)
      try {
        const tx = await mintCredits(toUser.walletAddress, amount, reason);
        await tx.wait();
      } catch (err) {
        // If on-chain fails, continue and still save the transaction locally for demo purposes
        console.warn("on-chain mint failed, saving transaction to Firestore for demo:", err);
      }

      // Save transaction in Firestore and update user credits
      await saveTransaction({
        userId: toUser.id,
        userName: toUser.name,
        type: "earn",
        amount,
        reason,
        createdBy: user?.id || "admin",
      } as any);

      // Refresh lists
      const [fetchedUsers, fetchedTransactions] = await Promise.all([
        getAllUsers(),
        getAllTransactions(),
      ]);
      setUsers(fetchedUsers);
      setTransactions(fetchedTransactions.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 10));

      toast.success(`Sent ${amount} CC to ${toUser.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send credits");
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword || !newRole) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setCreatingUser(true);
      const res = await createUserByAdmin(newEmail, newPassword, newName, newRole);
      if (res.success) {
        toast.success("User created");
        // Refresh users list
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
        // reset form
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("student");
      } else {
        toast.error(res.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Create user failed");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Welcome {user?.name}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          {/* Add your admin dashboard content here */}
          <div className="grid gap-6">
            {/* Create user form */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Add New User</h2>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="newName">Name</Label>
                  <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="newEmail">Email</Label>
                  <Input id="newEmail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="newPassword">Password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="newRole">Role</Label>
                  <select
                    id="newRole"
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as User["role"])}
                  >
                    <option value="student">Student</option>
                    <option value="canteen">Canteen</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleCreateUser} disabled={creatingUser}>
                  {creatingUser ? "Creating..." : "Create User"}
                </Button>
              </div>
            </Card>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Total Users</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">{users.length}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Total Transactions</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">{transactions.length}</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">System Status</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">Active</p>
              </Card>
            </div>

            {/* User Management */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">User Management</h2>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{user.credits} CC</TableCell>
                        <TableCell className="font-mono">
                          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                              </TableCell>
                              <TableCell>
                                <Button size="sm" onClick={() => handleSendRandomCredit(user)}>
                                  Give Random Credits
                                </Button>
                              </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Transaction History */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Recent Transactions</h2>
                </div>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.userName}</TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell>{tx.amount} CC</TableCell>
                        <TableCell>{tx.reason}</TableCell>
                        <TableCell>
                          {new Date(tx.date.seconds * 1000).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
