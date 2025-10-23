import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Coins, Award, ShoppingCart, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to appropriate dashboard if already authenticated
    if (isAuthenticated && user) {
      navigate(`/${user.role}`);
    }
  }, [isAuthenticated, user, navigate]);

  const features = [
    {
      icon: Award,
      title: "Earn Credits",
      description: "Attend classes, score well, participate in events to earn Campus Credits",
    },
    {
      icon: ShoppingCart,
      title: "Spend Credits",
      description: "Use your credits at the canteen, events, or campus stores",
    },
    {
      icon: Coins,
      title: "Blockchain Based",
      description: "All transactions are secure and verified on the blockchain",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your attendance, grades, and reward history in real-time",
    },
  ];

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="container relative mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary shadow-lg">
                <Wallet className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-5xl font-bold text-foreground">
              Campus Credits
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Blockchain-powered reward system for campus activities. Earn credits for attendance and achievements, spend them at the canteen.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="min-w-[200px]"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">How It Works</h2>
          <p className="text-muted-foreground">
            Simple, transparent, and rewarding for everyone
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 transition-all hover:shadow-lg">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="border-y bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <h3 className="mb-2 text-4xl font-bold text-primary">142</h3>
              <p className="text-muted-foreground">Active Students</p>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-4xl font-bold text-success">12,450</h3>
              <p className="text-muted-foreground">Credits Distributed</p>
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-4xl font-bold text-accent">3,200</h3>
              <p className="text-muted-foreground">Transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>Powered by Blockchain Technology • Built with React & Ethereum</p>
      </div>
    </div>
  );
};

export default Index;
