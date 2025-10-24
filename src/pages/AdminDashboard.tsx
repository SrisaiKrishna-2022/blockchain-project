import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Users, History, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User, Transaction, getAllUsers, getAllTransactions, saveTransaction, deleteAllTransactions, updateUser } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import { mintCredits } from "@/lib/contract";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, createUserByAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, string>>({});
  // Create user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<User["role"]>("student");
  const [creatingUser, setCreatingUser] = useState(false);
  // Grade assignment state
  const [gradeStudentId, setGradeStudentId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

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

  const handleResetUserCredits = async (targetUser: User) => {
    try {
      if (targetUser.role === "admin") {
        toast.error("Cannot reset credits for admin users");
        return;
      }

      const baseline = targetUser.role === "canteen" ? 100 : 60;

      // Update user credits in Firestore
      await updateUser({ ...targetUser, credits: baseline });

      // Refresh users list
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);

      toast.success(`${targetUser.name}'s credits reset to ${baseline} CC`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset user credits");
    }
  };

  const handleToggleShowWallet = async (targetUser: User) => {
    try {
      const current = !!targetUser.showWallet;
      await updateUser({ ...targetUser, showWallet: !current });
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      toast.success(`${targetUser.name}'s wallet visibility updated`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update wallet visibility');
    }
  };

  const handleSendCredit = async (toUser: User, selectedType?: string) => {
    try {
      if (!selectedType) {
        toast.error("Please select a credit type");
        return;
      }

      if (toUser.id === user?.id) {
        toast.error("Admins cannot credit themselves");
        return;
      }

      if (toUser.role === "admin") {
        toast.error("Cannot send credits to admins");
        return;
      }

      const creditMap: Record<string, { amount: number; reason: string }> = {
        attend: { amount: 15, reason: "Attend Class" },
        missed: { amount: -7, reason: "Missed Class" },
        sport: { amount: 10, reason: "Attended Sport" },
        event: { amount: 8, reason: "Attended Event" },
      };

      const selected = creditMap[selectedType];
      if (!selected) {
        toast.error("Invalid credit type selected");
        return;
      }

      const { amount, reason } = selected;

      // Only attempt on-chain mint for positive amounts
      if (amount > 0) {
        try {
          const tx = await mintCredits(toUser.walletAddress, amount, reason);
          await tx.wait();
        } catch (err) {
          console.warn("on-chain mint failed, saving transaction to Firestore for demo:", err);
        }
      }

      // Save transaction in Firestore and update user credits
      await saveTransaction({
        userId: toUser.id,
        userName: toUser.name,
        type: amount > 0 ? "earn" : "spend",
        amount,
        reason,
        createdBy: user?.id || "admin",
        date: Timestamp.now(),
      });

      // Refresh lists
      const [fetchedUsers, fetchedTransactions] = await Promise.all([
        getAllUsers(),
        getAllTransactions(),
      ]);
      setUsers(fetchedUsers);
      setTransactions(fetchedTransactions.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 10));

      toast.success(`Sent ${amount} CC (${reason}) to ${toUser.name}`);
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

  // Grade mapping: default assumption
  const gradeMap: Record<string, number> = {
    A: 40,
    "A-": 35,
    B: 30,
    C: 20,
    D: 10,
  };

  const handleAssignGrade = async () => {
    try {
      if (!gradeStudentId || !selectedGrade) {
        toast.error("Please select a student and a grade");
        return;
      }

      const toUser = users.find(u => u.id === gradeStudentId);
      if (!toUser) {
        toast.error("Selected student not found");
        return;
      }

      if (toUser.id === user?.id) {
        toast.error("Admins cannot assign grades to themselves");
        return;
      }

      if (toUser.role === "admin") {
        toast.error("Cannot assign grade credits to admins");
        return;
      }

      const amount = gradeMap[selectedGrade] ?? 0;
      const reason = `Grade ${selectedGrade}`;

      if (amount > 0) {
        try {
          const tx = await mintCredits(toUser.walletAddress, amount, reason);
          await tx.wait();
        } catch (err) {
          console.warn("on-chain mint failed for grade assignment:", err);
        }
      }

      await saveTransaction({
        userId: toUser.id,
        userName: toUser.name,
        type: "earn",
        amount,
        reason,
        createdBy: user?.id || "admin",
        date: Timestamp.now(),
      });

      // Refresh lists
      const [fetchedUsers, fetchedTransactions] = await Promise.all([
        getAllUsers(),
        getAllTransactions(),
      ]);
      setUsers(fetchedUsers);
      setTransactions(fetchedTransactions.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 10));

      toast.success(`Assigned ${amount} CC (${reason}) to ${toUser.name}`);
      setSelectedGrade(null);
      setGradeStudentId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign grade credits");
    }
  };

  const handleClearTransactions = async () => {
    // open modal instead of immediate action
    setShowClearDialog(true);
  };

  const confirmClearTransactions = async () => {
    try {
      // perform deletion only (do NOT change user credits)
      await deleteAllTransactions();

      const fetchedTransactions = await getAllTransactions();
      setTransactions(fetchedTransactions.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).slice(0, 10));

      toast.success("All transactions cleared (user credits were NOT changed)");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear transactions");
    } finally {
      setShowClearDialog(false);
    }
  };

  const cancelClearTransactions = () => setShowClearDialog(false);

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
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell>{u.role === 'admin' ? '∞' : `${u.credits} CC`}</TableCell>
                        <TableCell className="font-mono break-words max-w-xs">
                          {u.showWallet === false ? (
                            <span className="italic text-muted-foreground">Hidden</span>
                          ) : (
                            u.walletAddress
                          )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={selectedTypes[u.id] || ""}
                                    onValueChange={(val) => setSelectedTypes({ ...selectedTypes, [u.id]: val })}
                                  >
                                    <SelectTrigger className="w-44 h-8 text-sm">
                                      <SelectValue placeholder="Select credit type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="attend">Attend class (+15 CC)</SelectItem>
                                      <SelectItem value="missed">Missed class (-7 CC)</SelectItem>
                                      <SelectItem value="sport">Attended sport (+10 CC)</SelectItem>
                                      <SelectItem value="event">Attended event (+8 CC)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button size="sm" onClick={() => handleSendCredit(u, selectedTypes[u.id])}>
                                    Send
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleResetUserCredits(u)}>
                                    Reset
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleToggleShowWallet(u)}>
                                    {u.showWallet === false ? 'Show' : 'Hide'}
                                  </Button>
                                </div>
                              </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Grade Assignment */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Grades</h2>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assign grade-based credits</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div>
                  <Label>Student</Label>
                  <select className="w-full rounded-md border bg-transparent px-3 py-2 text-sm" value={gradeStudentId || ""} onChange={(e) => setGradeStudentId(e.target.value || null)}>
                    <option value="">Select student</option>
                    {users.filter(u => u.role === 'student').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Grade</Label>
                  <select className="w-full rounded-md border bg-transparent px-3 py-2 text-sm" value={selectedGrade || ""} onChange={(e) => setSelectedGrade(e.target.value || null)}>
                    <option value="">Select grade</option>
                    <option value="A">A (+40 CC)</option>
                    <option value="A-">A- (+35 CC)</option>
                    <option value="B">B (+30 CC)</option>
                    <option value="C">C (+20 CC)</option>
                    <option value="D">D (+10 CC)</option>
                  </select>
                </div>
                <div className="mt-2">
                  <Button onClick={handleAssignGrade}>Assign Grade Credits</Button>
                </div>
              </div>
            </Card>

            {/* Transaction History */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Recent Transactions</h2>
                </div>
                <div>
                  <Button size="sm" variant="destructive" onClick={handleClearTransactions}>
                    Clear Transactions
                  </Button>
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
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              This will permanently delete ALL transactions. User credits will NOT be changed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelClearTransactions}>Cancel</Button>
            <Button variant="destructive" onClick={confirmClearTransactions}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
