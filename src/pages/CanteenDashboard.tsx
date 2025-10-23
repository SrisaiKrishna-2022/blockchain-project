import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, DollarSign, CheckCircle, TrendingUp } from "lucide-react";

const CanteenDashboard = () => {
  const { user, logout } = useAuth();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [studentAddress, setStudentAddress] = useState("");

  const stats = [
    { label: "Today's Sales", value: "428 CC", icon: DollarSign, color: "text-success" },
    { label: "Transactions", value: "67", icon: ShoppingCart, color: "text-primary" },
    { label: "Total Collected", value: "12,340 CC", icon: TrendingUp, color: "text-accent" },
  ];

  const recentTransactions = [
    { id: 1, student: "Alex Johnson", amount: 15, item: "Lunch Combo", time: "12:30 PM" },
    { id: 2, student: "Sarah Chen", amount: 8, item: "Snacks", time: "11:45 AM" },
    { id: 3, student: "Michael Kumar", amount: 20, item: "Premium Meal", time: "11:20 AM" },
    { id: 4, student: "Emily Davis", amount: 5, item: "Coffee", time: "10:50 AM" },
  ];

  const handleAcceptPayment = () => {
    if (!studentAddress || !paymentAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success(`Payment of ${paymentAmount} CC accepted from ${studentAddress.slice(0, 6)}...${studentAddress.slice(-4)}`);
    setPaymentAmount("");
    setStudentAddress("");
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar walletAddress={user?.walletAddress || ""} role="canteen" onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Canteen Dashboard</h2>
          <p className="text-muted-foreground">Accept student payments with Campus Credits</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                </div>
                <stat.icon className={`h-12 w-12 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Payment Form */}
        <Card className="mb-8 p-6">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <h3 className="text-xl font-semibold text-foreground">Accept Payment</h3>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="studentPaymentAddress">Student Wallet Address</Label>
                <Input
                  id="studentPaymentAddress"
                  placeholder="0x..."
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="paymentAmount">Amount (Campus Credits)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="e.g., 15"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleAcceptPayment}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Accept Payment
              </Button>
            </div>
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6">
              <p className="mb-2 text-sm font-medium text-foreground">QR Code Scanner</p>
              <div className="mb-4 flex aspect-square items-center justify-center rounded-lg bg-background">
                <div className="text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-xs">QR scanner would appear here</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Students can scan QR code to pay instantly with their Campus Credits
              </p>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.student}</p>
                    <p className="text-sm text-muted-foreground">{tx.item} • {tx.time}</p>
                  </div>
                </div>
                <span className="text-lg font-semibold text-success">{tx.amount} CC</span>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default CanteenDashboard;
