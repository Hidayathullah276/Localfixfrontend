import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Shield, Wrench, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState("");

  const handleSendOtp = async () => {
    toast.info("Phone OTP is simulated in migration. Use email/password below.");
  };

  const handleVerifyOtp = async () => {
    toast.info("Phone OTP is simulated in migration. Use email/password below.");
  };

  // For demo purposes, also allow email login
  const [useEmail, setUseEmail] = useState(true); // Default to true for migration
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        const data = await api.post('/auth/register', {
          email,
          password,
          full_name: fullName
        });
        signIn(data);
        toast.success("Account created!");
      } else {
        const data = await api.post('/auth/login', { email, password });
        signIn(data);
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero opacity-10" />
      <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
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
          <p className="text-muted-foreground">Your trusted local service platform</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8">
          {!useEmail ? (
            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-display font-bold text-foreground">Get Started</h2>
                  <p className="text-muted-foreground text-sm">Enter your phone number to continue</p>

                  <Input
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full btn-primary-gradient flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-display font-bold text-foreground">Verify OTP</h2>
                  <p className="text-muted-foreground text-sm">
                    Enter the 6-digit code sent to {phone}
                  </p>

                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="pl-10 text-center text-xl tracking-[0.5em]"
                    />
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full btn-primary-gradient flex items-center justify-center gap-2"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStep("phone")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change phone number
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              {isSignUp && (
                <Input
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full btn-primary-gradient"
              >
                {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </button>
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
              </button>
            </motion.div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setUseEmail(!useEmail)}
              className="w-full text-sm text-primary hover:underline"
            >
              {useEmail ? "Use phone number instead" : "Use email instead (demo)"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
