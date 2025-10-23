import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Calendar, Award, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import FirebaseConfig from "./firebaseconfig";

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  const studentData = {
    name: "Alex Johnson",
    rollNo: "21CS042",
    department: "Computer Science",
    credits: 156,
    nftId: "#0042",
  };

  const transactions = [
    { id: 1, type: "earn", amount: 10, reason: "Class Attendance", date: "2024-01-20" },
    { id: 2, type: "spend", amount: -15, reason: "Canteen Purchase", date: "2024-01-19" },
    { id: 3, type: "earn", amount: 20, reason: "Sports Event", date: "2024-01-18" },
    { id: 4, type: "earn", amount: 5, reason: "Good Grade", date: "2024-01-17" },
  ];

  const attendance = [
    { subject: "Data Structures", attended: 28, total: 30, percentage: 93 },
    { subject: "Web Development", attended: 25, total: 28, percentage: 89 },
    { subject: "Database Systems", attended: 26, total: 30, percentage: 87 },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar walletAddress={user?.walletAddress || ""} role={user?.role || "student"} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Student Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>

        {/* NFT ID Card + Credits */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden border-0 bg-gradient-primary p-6 text-white">
            <div className="absolute right-4 top-4 text-xs opacity-60">NFT ID {studentData.nftId}</div>
            <div className="mt-4">
              <p className="text-sm opacity-90">Student ID</p>
              <h3 className="mb-2 text-2xl font-bold">{user?.name}</h3>
              <div className="space-y-1 text-sm opacity-90">
                <p>Email: {user?.email}</p>
                <p>Department: {studentData.department}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Award className="h-5 w-5" />
              <span className="text-xs">Blockchain Verified</span>
            </div>
          </Card>

          <Card className="border-0 bg-gradient-success p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available Credits</p>
                <h3 className="mb-2 text-4xl font-bold">{studentData.credits}</h3>
                <p className="text-xs opacity-80">Campus Credits (CC)</p>
              </div>
              <Coins className="h-16 w-16 opacity-20" />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">+35 this month</span>
            </div>
          </Card>
        </div>

        {/* Attendance */}
        <Card className="mb-8 p-6">
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

        {/* Transaction History */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
          </div>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg border bg-muted/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      tx.type === "earn" ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    {tx.type === "earn" ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.reason}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <span
                  className={`text-lg font-semibold ${
                    tx.type === "earn" ? "text-success" : "text-destructive"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount} CC
                </span>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
