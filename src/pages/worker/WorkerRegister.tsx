import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, FileText, Wrench, CheckCircle2, User, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const skillOptions = ["Plumber", "Electrician", "Bathroom Cleaning", "House Cleaning", "Home Shifting", "AC Repair", "Carpenter"];

export default function WorkerRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingWorker, setCheckingWorker] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = await api.get("/workers/me");
        if (cancelled || !w) {
          setCheckingWorker(false);
          return;
        }
        if (w.status === "approved") {
          toast.info("You are already an approved worker.");
          navigate("/worker", { replace: true });
          return;
        }
        if (w.status === "suspended") {
          toast.error("Your worker account is suspended. Contact support.");
          navigate("/", { replace: true });
          return;
        }
        if (w.status === "pending") {
          toast.info("Update your application below if needed, then submit again.", {
            description: "We keep one application per account; resubmitting replaces your pending details.",
          });
        } else if (w.status === "rejected") {
          toast.info("Your last application was rejected. Submit again with updated details.");
        }
      } catch {
        /* not registered yet */
      } finally {
        if (!cancelled) setCheckingWorker(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);
  const [name, setName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Verification States
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo1File, setPhoto1File] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);
  const [photo2File, setPhoto2File] = useState<File | null>(null);

  // Camera Management
  const [activeSlot, setActiveSlot] = useState<1 | 2 | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAadhaarFile(e.target.files[0]);
      toast.success("Identity document attached");
    }
  };

  const startCamera = async (slot: 1 | 2) => {
    setActiveSlot(slot);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Could not access camera");
      setActiveSlot(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setActiveSlot(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current && activeSlot) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL("image/jpeg");
      if (activeSlot === 1) setPhoto1(dataUrl);
      else setPhoto2(dataUrl);
      
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `verification_photo_${activeSlot}.jpg`, { type: "image/jpeg" });
          if (activeSlot === 1) setPhoto1File(file);
          else setPhoto2File(file);
        });
        
      stopCamera();
      toast.success(`Verification image ${activeSlot} recorded!`);
    }
  };

  const handleSubmit = async () => {
    if (!name || skills.length === 0) {
      toast.error("Please provide your name and expertise");
      return;
    }
    if (!aadhaarFile || !photo1File || !photo2File) {
        toast.error("Full account verification requires all 3 documents");
        return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("experience_years", experience);
      formData.append("address", address);
      formData.append("skills", skills.join(","));
      formData.append("aadhaar", aadhaarFile);
      certificateFiles.forEach((file) => formData.append("certificates", file));
      formData.append("photo1", photo1File);
      formData.append("photo2", photo2File);

      await api.postFormData("/workers/register", formData);
      toast.success("Application submitted successfully");
      setDone(true);
    } catch (error: any) {
      toast.error("Process failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingWorker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-background border border-border/50 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-4 tracking-tight">Application Sent!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-10 px-4">
            Your documents and profile are being reviewed. We'll notify you once your account is activated for service.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="w-full btn-primary-gradient py-5 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Main Header with consistent brand gradient */}
      <div className="gradient-primary pt-20 pb-16 px-6 rounded-b-[3.5rem] shadow-[0_10px_30px_-10px_rgba(80,60,160,0.3)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15 pointer-events-none" />
        <button 
          onClick={() => navigate("/")} 
          className="relative z-20 text-white/90 mb-8 hover:text-white transition-all bg-white/10 p-2 rounded-xl backdrop-blur-md hover:bg-white/20 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold text-white tracking-tight drop-shadow-sm">
            Join Our Expert Team
          </h1>
          <p className="text-white/80 text-sm mt-2 max-w-[240px] leading-snug">
            Verify your identity and start your journey with LocalFix.
          </p>
        </div>
      </div>

      <div className="px-5 -mt-10 space-y-5 relative z-10">
        {/* Basic Info */}
        <div className="bg-background rounded-3xl p-6 shadow-sm border border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Personal Details
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-primary/80 ml-1 uppercase tracking-wider">Full Name</label>
              <Input 
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="bg-muted/40 border-border/40 h-12 rounded-2xl text-sm focus-visible:ring-primary/20 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-primary/80 ml-1 uppercase tracking-wider">Phone Number</label>
              <Input
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-muted/40 border-border/40 h-12 rounded-2xl text-sm focus-visible:ring-primary/20 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-primary/80 ml-1 uppercase tracking-wider">Home Address</label>
              <Input
                placeholder="Street, Area, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-muted/40 border-border/40 h-12 rounded-2xl text-sm focus-visible:ring-primary/20 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-primary/80 ml-1 uppercase tracking-wider">Experience (Years)</label>
              <Input 
                type="number" 
                placeholder="2" 
                value={experience} 
                onChange={(e) => setExperience(e.target.value)}
                className="bg-muted/40 border-border/40 h-12 rounded-2xl text-sm focus-visible:ring-primary/20 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Skills Selector */}
        <div className="bg-background rounded-3xl p-6 shadow-sm border border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" /> Service Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2.5 rounded-full text-[11px] font-bold transition-all ${
                  skills.includes(skill)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Verification Assets - 1 Aadhaar, 2 Live Photos */}
        <div className="bg-background rounded-3xl p-6 shadow-sm border border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Identity Verification
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Aadhaar Upload Card */}
            <label className="aspect-square border-2 border-dashed border-border/50 rounded-2xl text-center hover:border-primary/30 transition-colors cursor-pointer group relative flex flex-col items-center justify-center p-2">
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
              {aadhaarFile ? (
                   <div className="absolute inset-0 bg-emerald-500/10 flex flex-col items-center justify-center">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                       <span className="text-[7px] font-bold text-emerald-600 truncate px-1 w-full text-center mt-1">ID SECURED</span>
                   </div>
              ) : (
                  <>
                    <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-1" />
                    <p className="text-[8px] font-bold text-foreground">AADHAAR / ID</p>
                  </>
              )}
            </label>
            
            {/* Live Photo 1 */}
            <div 
                onClick={() => startCamera(1)}
                className="aspect-square border-2 border-dashed border-border/50 rounded-2xl text-center hover:border-primary/30 transition-colors cursor-pointer group relative flex flex-col items-center justify-center"
            >
              {photo1 ? (
                  <div className="absolute inset-0 group rounded-2xl overflow-hidden">
                      <img src={photo1} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <RefreshCw className="w-5 h-5 text-white" />
                      </div>
                  </div>
              ) : (
                  <>
                    <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-1" />
                    <p className="text-[8px] font-bold text-foreground">LIVE PHOTO 1</p>
                  </>
              )}
            </div>

            {/* Live Photo 2 */}
            <div 
                onClick={() => startCamera(2)}
                className="aspect-square border-2 border-dashed border-border/50 rounded-2xl text-center hover:border-primary/30 transition-colors cursor-pointer group relative flex flex-col items-center justify-center"
            >
              {photo2 ? (
                  <div className="absolute inset-0 group rounded-2xl overflow-hidden">
                      <img src={photo2} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <RefreshCw className="w-5 h-5 text-white" />
                      </div>
                  </div>
              ) : (
                  <>
                    <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-1" />
                    <p className="text-[8px] font-bold text-foreground">LIVE PHOTO 2</p>
                  </>
              )}
            </div>
          </div>
          <label className="mt-3 block text-[10px] font-bold text-foreground/60">CERTIFICATES (OPTIONAL)</label>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => setCertificateFiles(Array.from(e.target.files || []))}
            className="mt-1 block w-full text-xs"
          />
          <div className="mt-4 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-indigo-700 leading-tight">
              <b>Important:</b> Documents are required to prevent fraud. High-quality live photos ensure authenticity.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading || !aadhaarFile || !photo1File || !photo2File}
          className="w-full btn-primary-gradient text-lg py-5 shadow-2xl shadow-primary/30 relative overflow-hidden group disabled:opacity-50 disabled:grayscale transition-all rounded-[1.5rem]"
        >
          <span className="relative z-10 font-bold tracking-tight">
            {loading ? "Registering Agent..." : "Submit Application"}
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </motion.button>

        <p className="text-[10px] text-center text-muted-foreground px-8">
          By submitting, you agree to our Terms of Service and Privacy Policy for Service Providers.
        </p>
      </div>

      {/* Camera Interface Overlay */}
      <AnimatePresence>
        {activeSlot && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-sm bg-background/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10"
                >
                    <div className="relative aspect-[3/4] bg-muted">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-0 border-[4rem] border-black/40 pointer-events-none">
                            <div className="w-full h-full border border-white/20 rounded-[3rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                                <div className="w-48 h-48 border-2 border-dashed border-white/60 rounded-full" />
                            </div>
                        </div>
                        <button 
                            onClick={stopCamera}
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xl border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="p-10 text-center bg-background">
                        <h4 className="font-display font-bold text-2xl mb-2 tracking-tight">Live Photo {activeSlot}</h4>
                        <p className="text-[11px] text-muted-foreground mb-10 px-4">Ensure your face is well-lit and fits the circle guide.</p>
                        
                        <div className="flex items-center justify-center">
                            <button 
                                onClick={takePhoto}
                                className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 ring-4 ring-primary/20 active:scale-95 transition-all"
                            >
                                <Camera className="w-10 h-10 text-white" />
                            </button>
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
