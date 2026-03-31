import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, FileText, Wrench, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";

const skillOptions = ["Plumber", "Electrician", "Bathroom Cleaning", "House Cleaning", "Home Shifting", "AC Repair", "Carpenter"];

export default function WorkerRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    if (!name || skills.length === 0) {
      toast.error("Please fill name and select at least one skill");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      await api.post("/workers/register", {
        name,
        phone,
        skills,
        experience_years: parseInt(experience) || 0
      });
      setDone(true);
      toast.success("Registration submitted!");
    } catch (error: any) {
      toast.error("Registration failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Application Submitted!</h2>
          <p className="text-muted-foreground text-sm mb-2">Your status: <span className="font-semibold text-amber-600">PENDING VERIFICATION</span></p>
          <p className="text-muted-foreground text-xs mb-6">An admin will review and approve your profile. You'll be notified once approved.</p>
          <button onClick={() => navigate("/")} className="btn-primary-gradient">Go to Home</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero p-6 pb-20 rounded-b-[3rem] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary-foreground/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-display font-bold text-primary-foreground mb-2">Join LocalFix Pro</h1>
            <p className="text-primary-foreground/70 text-sm max-w-[250px]">
              Complete your profile and start receiving job requests in your area.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4 pb-12 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-4 shadow-xl shadow-primary/5"
        >
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Details
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Full Name</label>
              <Input placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/50 focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Phone Number</label>
              <Input placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50 border-border/50 focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Years of Experience</label>
              <Input placeholder="e.g. 5" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="bg-background/50 border-border/50 focus:border-primary/50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 shadow-xl shadow-primary/5"
        >
          <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" /> Select Your Skills
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Choose one or more categories you specialize in.</p>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((skill) => {
              const selected = skills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all transform active:scale-95 ${selected
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 space-y-4 shadow-xl shadow-primary/5"
        >
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Verification Documents
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="border-2 border-dashed border-border/50 rounded-2xl p-4 text-center hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[10px] font-medium text-foreground">Aadhaar / ID</p>
              <p className="text-[8px] text-muted-foreground mt-0.5">Required</p>
            </div>
            <div className="border-2 border-dashed border-border/50 rounded-2xl p-4 text-center hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-[10px] font-medium text-foreground">Profile Photo</p>
              <p className="text-[8px] text-muted-foreground mt-0.5">Required</p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">i</div>
            <p className="text-[10px] text-amber-600 leading-tight">
              Documents are required for background verification. Your profile will be visible to customers only after approval.
            </p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full btn-primary-gradient text-lg py-5 shadow-2xl shadow-primary/30 relative overflow-hidden group"
        >
          <span className="relative z-10 font-bold tracking-tight">
            {loading ? "Submitting Application..." : "Submit Application"}
          </span>
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
        </motion.button>

        <p className="text-[10px] text-center text-muted-foreground px-8">
          By submitting, you agree to our Terms of Service and Privacy Policy for Service Providers.
        </p>
      </div>
    </div>
  );
}
