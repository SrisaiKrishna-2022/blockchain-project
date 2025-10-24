import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction, getUserTransactions, updateUser } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import FirebaseConfig from "./firebaseconfig";

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  const studentData = {
    name: user?.name || "Alex Johnson",
    rollNo: "21CS042",
    department: "Computer Science",
    credits: user?.credits || 156,
    nftId: user?.nftId || "#0000",
    walletAddress: user?.walletAddress || "0x0000000000000000000000000000000000000000",
    showWallet: user?.showWallet ?? true,
  };

  const formatNft = (nftId: string, walletAddr: string) => {
    // Make NFT display a bit more complex by combining the nftId and a short wallet fingerprint
    const fp = walletAddr.replace(/^0x/, '').slice(-8).toUpperCase();
    return `${nftId}-${fp}`;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const attendance = [
    { subject: "Data Structures", attended: 28, total: 30, percentage: 93 },
    { subject: "Web Development", attended: 25, total: 28, percentage: 89 },
    { subject: "Database Systems", attended: 26, total: 30, percentage: 87 },
  ];

  const handleLogout = () => {
    logout();
  };

  const [showWallet, setShowWallet] = useState<boolean>(user?.showWallet ?? true);

  const toggleShowWallet = async () => {
    if (!user) return;
    try {
      await updateUser({ ...user, showWallet: !showWallet });
      setShowWallet(!showWallet);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id) return;
      const txs = await getUserTransactions(user.id);
      // sort by date desc
      const sorted = txs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));
      setTransactions(sorted.slice(0, 20));
    };
    loadTransactions();
  }, [user]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Welcome {user?.name}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Available Credits</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">{studentData.credits} CC</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Student Info</h3>
                </div>
                <p className="mt-2 font-medium">{studentData.name}</p>
                <p className="text-sm text-muted-foreground">{studentData.department}</p>
                <p className="mt-2 text-sm font-mono break-words">Wallet: {showWallet ? studentData.walletAddress : <span className="italic text-muted-foreground">Hidden</span>}</p>
                <div className="mt-2">
                  <button className="text-sm text-primary underline" onClick={toggleShowWallet}>{showWallet ? 'Hide my wallet' : 'Show my wallet'}</button>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">NFT</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">{formatNft(studentData.nftId, studentData.walletAddress)}</p>
                <p className="text-xs text-muted-foreground mt-1">Full: {studentData.nftId} • Wallet fingerprint: {studentData.walletAddress.slice(-8)}</p>
              </Card>
            </div>


            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.reason}</TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell>{tx.amount} CC</TableCell>
                        <TableCell>
                          {tx.date ? new Date(((tx.date as unknown) as Timestamp).seconds * 1000).toLocaleString() : "-"}
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

export default StudentDashboard;
