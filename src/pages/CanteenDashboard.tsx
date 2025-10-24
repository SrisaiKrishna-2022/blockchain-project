import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, DollarSign, CheckCircle, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Canteen Dashboard</h1>
              </div>
              <p className="text-muted-foreground">Accept student payments with Campus Credits</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-3">
              {stats.map((stat, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                    </div>
                    <stat.icon className={`h-10 w-10 ${stat.color}`} />
                  </div>
                </Card>
              ))}
            </div>

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

            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.student}</TableCell>
                        <TableCell>{tx.item}</TableCell>
                        <TableCell>{tx.amount} CC</TableCell>
                        <TableCell>{tx.time}</TableCell>
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

export default CanteenDashboard;
