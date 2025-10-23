import { Wallet, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  walletAddress?: string;
  role?: "student" | "admin" | "canteen";
  onLogout?: () => void;
}

const Navbar = ({ walletAddress, role, onLogout }: NavbarProps) => {
  const getRoleLabel = () => {
    switch (role) {
      case "admin":
        return "Admin";
      case "canteen":
        return "Canteen";
      case "student":
        return "Student";
      default:
        return "";
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Campus Credits</h1>
              <p className="text-xs text-muted-foreground">Blockchain Rewards System</p>
            </div>
          </div>

          {walletAddress && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2">
                <User className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">{getRoleLabel()}</p>
                  <p className="text-xs text-muted-foreground">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
