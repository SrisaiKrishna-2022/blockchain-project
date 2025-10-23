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
import { User, Transaction, getAllUsers, getAllTransactions } from "@/lib/firestore";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
