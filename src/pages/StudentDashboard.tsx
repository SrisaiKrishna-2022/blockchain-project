import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Calendar, Award } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction, getUserTransactions } from "@/lib/firestore";
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
    nftId: "#0042",
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
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">NFT ID</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">{studentData.nftId}</p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Attendance Overview</h3>
              </div>
              <div className="space-y-4">
                {attendance.map((item, index) => (
                  <div key={index} className="rounded-lg border bg-muted/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{item.subject}</h4>
                      <Badge variant={item.percentage >= 85 ? "default" : "secondary"}>
                        {item.percentage}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.attended}/{item.total} classes</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full bg-success transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

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
                          {tx.date ? new Date((tx.date as any).seconds * 1000).toLocaleString() : "-"}
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
