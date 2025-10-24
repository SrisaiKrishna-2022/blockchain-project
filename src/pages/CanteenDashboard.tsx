import { useEffect, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, DollarSign, CheckCircle, TrendingUp } from "lucide-react";
import { getAllTransactions, Transaction, updateUser } from "@/lib/firestore";
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
  // studentIdentifier holds either a wallet address or a full name depending on identifierType
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<'wallet' | 'name'>('wallet');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const items = [
    { id: "shirt", title: "Shirt", price: 250, file: "shirt.png" },
    { id: "drink", title: "Drink", price: 20, file: "drink.png" },
    { id: "book", title: "Book", price: 120, file: "book.png" },
    { id: "a4", title: "A4 bundle", price: 60, file: "a4_bundle.png" },
  ];

  const [stats, setStats] = useState<{ label: string; value: string; icon: ComponentType<{ className?: string }>; color: string }[]>([]);
  type RecentTx = { id: string; student: string; amount: number; item: string; time: string };
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);

  const handleAcceptPayment = () => {
    if (!studentIdentifier || !paymentAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    const who = identifierType === 'wallet'
      ? `${studentIdentifier.slice(0, 6)}...${studentIdentifier.slice(-4)}`
      : studentIdentifier;

    toast.success(`Payment of ${paymentAmount} CC accepted from ${who}`);
    setPaymentAmount("");
    setStudentIdentifier("");
  };

  const handleSelectItem = (itemId: string) => {
    const it = items.find(i => i.id === itemId);
    if (!it) return;
    setSelectedItemId(itemId);
    setPaymentAmount(String(it.price));
  };

  const handleLogout = () => {
    logout();
  };

  const [showWalletLocal, setShowWalletLocal] = useState<boolean>(user?.showWallet ?? true);

  const toggleShowWalletLocal = async () => {
    if (!user) return;
    try {
      await updateUser({ ...user, showWallet: !showWalletLocal });
      setShowWalletLocal(!showWalletLocal);
    } catch (err) {
      console.error(err);
    }
  };

  const formatNft = (nftId: string | undefined, walletAddr: string | undefined) => {
    const id = nftId || "#0000";
    const addr = walletAddr || "0x0000000000000000000000000000000000000000";
    const fp = addr.replace(/^0x/, '').slice(-8).toUpperCase();
    return `${id}-${fp}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const txs = await getAllTransactions();
        // sort desc by date
        const sorted = txs.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0));

        // compute totals
        const totalTransactions = txs.length;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;

        let todaysSales = 0;
        let totalCollected = 0;

        txs.forEach((t: Transaction) => {
          const amount = Number(t.amount) || 0;
          // consider 'spend' transactions as sales
          if (t.type === "spend") {
            totalCollected += Math.abs(amount);
            const ts = (t.date?.seconds || 0);
            if (ts >= startOfDay) {
              todaysSales += Math.abs(amount);
            }
          }
        });

        setStats([
          { label: "Today's Sales", value: `${todaysSales} CC`, icon: DollarSign, color: 'text-success' },
          { label: 'Transactions', value: `${totalTransactions}`, icon: ShoppingCart, color: 'text-primary' },
          { label: 'Total Collected', value: `${totalCollected} CC`, icon: TrendingUp, color: 'text-accent' },
        ]);

        // map recent txs to display-friendly items (take first 8)
        setRecentTransactions(sorted.slice(0, 8).map((t: Transaction) => ({
          id: t.id,
          student: t.userName,
          amount: Math.abs(Number(t.amount) || 0),
          item: t.reason,
          time: t.date ? new Date(t.date.seconds * 1000).toLocaleString() : '-',
        })));
      } catch (err) {
        console.error("Failed to load canteen stats:", err);
      }
    };

    load();
  }, []);

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
              <p className="text-xs text-muted-foreground mt-1">Wallet: {showWalletLocal && user?.walletAddress ? user.walletAddress : (showWalletLocal ? '-' : 'Hidden')} • NFT: {formatNft(user?.nftId, user?.walletAddress)}</p>
              <div className="mt-1">
                <button className="text-sm text-primary underline" onClick={toggleShowWalletLocal}>{showWalletLocal ? 'Hide my wallet' : 'Show my wallet'}</button>
              </div>
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
                    <Label htmlFor="identifierType">Identifier</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        id="identifierType"
                        className="rounded-md border bg-transparent px-3 py-2 text-sm"
                        value={identifierType}
                        onChange={(e) => setIdentifierType(e.target.value as 'wallet' | 'name')}
                      >
                        <option value="wallet">Wallet Address</option>
                        <option value="name">Full Name</option>
                      </select>
                    </div>

                    <div className="mt-3">
                      <Label htmlFor="studentIdentifier">{identifierType === 'wallet' ? 'Student Wallet Address' : 'Student Full Name'}</Label>
                      <Input
                        id="studentIdentifier"
                        placeholder={identifierType === 'wallet' ? '0x...' : 'Full name e.g., John Doe'}
                        value={studentIdentifier}
                        onChange={(e) => setStudentIdentifier(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Quick Items</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      {items.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => { handleSelectItem(it.id); /* keep selection visible */ }}
                          className={`flex flex-col items-center gap-3 rounded-lg border p-4 text-center hover:shadow-md ${selectedItemId === it.id ? 'ring-2 ring-primary' : ''}`}
                        >
                          <img src={`/images/${it.file}`} alt={it.title} className="h-16 w-16 rounded-md object-cover" />
                          <div>
                            <div className="font-medium">{it.title}</div>
                            <div className="text-sm text-muted-foreground">{it.price} CC</div>
                          </div>
                        </button>
                      ))}
                    </div>
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
                  <div className="mb-4 flex h-32 w-24 items-center justify-center rounded-lg bg-background">
                    <div className="text-center text-muted-foreground">
                      <ShoppingCart className="mx-auto mb-2 h-10 w-10" />
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
