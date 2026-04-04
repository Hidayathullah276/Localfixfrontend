import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (isSignUp && !fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const data = await api.post("/auth/register", {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
        });
        signIn(data);
        toast.success("Account created!");
      } else {
        const data = await api.post("/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        });
        signIn(data);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-10" />
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
              <Wrench className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-display font-bold gradient-text">LocalFix</span>
          </motion.div>
          <p className="text-muted-foreground">Sign in with email and password</p>
        </div>

        <div className="glass-card p-8 space-y-4">
          <h2 className="text-2xl font-display font-bold text-foreground">
            {isSignUp ? "Create account" : "Welcome back"}
          </h2>

          {isSignUp && (
            <>
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
              <Input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </>
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary-gradient"
          >
            {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
