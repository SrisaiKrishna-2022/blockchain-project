import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, isAdmin, hasAnyAdmin } from "@/lib/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup, resetPassword, createUserByAdmin, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<User["role"]>("student");
  const [adminExists, setAdminExists] = useState(false);

  // Reset password state
  const [resetEmail, setResetEmail] = useState("");

  // Check if admin exists
  useEffect(() => {
    const checkAdmin = async () => {
      const hasAdmin = await hasAnyAdmin();
      setAdminExists(hasAdmin);
    };
    checkAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(loginEmail, loginPassword);
    
    if (result.success) {
      toast.success("Logged in successfully");
      // Get user role from the result directly
      const userRole = result.user?.role;
      console.log("Login successful, user role:", userRole);
      
      if (!userRole) {
        console.error("No user role found after login");
        toast.error("Error loading user data");
        return;
      }

      if (userRole === "admin") {
        console.log("Navigating to admin dashboard");
        navigate("/admin");
      } else if (userRole === "canteen") {
        console.log("Navigating to canteen dashboard");
        navigate("/canteen");
      } else {
        console.log("Navigating to student dashboard");
        navigate("/student");
      }
    } else {
      toast.error(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (signupRole === "admin") {
        if (adminExists) {
          // If admin exists, check if current user is admin
          if (!user?.id) {
            toast.error("Please log in as an admin to create additional admin accounts.");
            return;
          }

          const isAdminUser = await isAdmin(user.id);
          if (!isAdminUser) {
            toast.error("Only admins can create additional admin accounts.");
            return;
          }

          // Use admin-specific creation method for additional admins
          const { success, error } = await createUserByAdmin(signupEmail, signupPassword, signupName, signupRole);
          if (success) {
            console.log("Created additional admin account");
            toast.success("Admin account created successfully");
            navigate(`/${signupRole}`);
          } else {
            toast.error(error || "Failed to create admin account");
          }
        } else {
          console.log("Creating first admin account");
          // First admin signup - use regular signup but with admin role
          const { success, error } = await signup(signupEmail, signupPassword, signupName, "admin");
          if (success) {
            console.log("First admin account created successfully");
            toast.success("Admin account created successfully");
            // Wait briefly for Firestore to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            navigate("/admin");
          } else {
            console.error("Failed to create first admin:", error);
            toast.error(error || "Failed to create admin account");
          }
        }
      } else {
        // Regular user signup
        const { success, error } = await signup(signupEmail, signupPassword, signupName, signupRole);
        if (success) {
          toast.success("Account created successfully");
          navigate(`/${signupRole}`);
        } else {
          toast.error(error || "Failed to create account");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

    const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      toast.success("Password reset email sent. Check your inbox.");
      setResetEmail("");
    } else {
      toast.error(result.error || "Password reset failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-lg">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Campus Credits</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-role">Role</Label>
                  <Select value={signupRole} onValueChange={(value: any) => setSignupRole(value)}>
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      {!adminExists && <SelectItem value="admin">Admin</SelectItem>}
                      <SelectItem value="canteen">Canteen</SelectItem>
                    </SelectContent>
                  </Select>
                  {adminExists && signupRole === "admin" && (
                    <p className="mt-1 text-sm text-red-500">
                      An admin already exists. Please contact them to create additional admin accounts.
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>

                        <TabsContent value="reset">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Authentication backed by Firebase
        </p>
      </div>
    </div>
  );
};

export default Auth;
