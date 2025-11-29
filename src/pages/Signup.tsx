import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const requestSchema = z.object({
  full_name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  reason: z.string().max(500, { message: "Reason must be less than 500 characters" }).optional(),
});

export default function Signup() {
  const location = useLocation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // Guard: ensure router context exists
  if (!location) return null;

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = requestSchema.safeParse({ full_name: fullName, email, reason });
    if (!result.success) {
      const errors = result.error.errors.map(err => err.message).join(", ");
      toast.error(errors);
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          full_name: fullName.trim(),
          email: email.trim(),
          reason: reason.trim() || null
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("This email has already been submitted");
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success("Your request has been submitted. We'll review it and get back to you.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex items-center justify-center px-4">
      {/* Animated gradient orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-background"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.h1 
                className="text-8xl md:text-9xl font-black tracking-tight text-foreground"
                animate={{ 
                  textShadow: [
                    '0 0 20px hsl(180 60% 50% / 0.4)',
                    '0 0 40px hsl(180 60% 50% / 0.7)',
                    '0 0 20px hsl(180 60% 50% / 0.4)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                KNEW
              </motion.h1>
            </motion.div>
            <motion.p
              className="text-muted-foreground mt-4 text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Global News. Unfiltered.
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            className="relative w-full max-w-md z-10"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {!submitted ? (
              <>
                <div className="text-center mb-8">
                  <motion.h1 
                    className="text-5xl font-black tracking-tight text-foreground mb-2"
                    animate={{ 
                      textShadow: [
                        '0 0 10px hsl(180 60% 50% / 0.3)',
                        '0 0 20px hsl(180 60% 50% / 0.5)',
                        '0 0 10px hsl(180 60% 50% / 0.3)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    KNEW
                  </motion.h1>
                  <p className="text-muted-foreground">Request Intelligence Access</p>
                </div>
                
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="relative bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-accent/20 shadow-2xl shadow-accent/10 space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                        Full Name
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="bg-background/50 border-accent/30 focus:border-accent focus:ring-accent/50 transition-all duration-300"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="bg-background/50 border-accent/30 focus:border-accent focus:ring-accent/50 transition-all duration-300"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-foreground mb-2">
                        Why do you want access? (Optional)
                      </label>
                      <Textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Tell us why you'd like to join KNEW"
                        rows={3}
                        className="bg-background/50 border-accent/30 focus:border-accent focus:ring-accent/50 transition-all duration-300 resize-none"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground relative overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-accent/50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting request...
                        </span>
                      ) : (
                        "Request Access"
                      )}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                  </motion.div>

                  <motion.p 
                    className="text-center text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    Already have an account?{" "}
                    <Link to="/login" className="text-accent hover:underline transition-colors">
                      Enter KNEW
                    </Link>
                  </motion.p>
                </motion.form>
              </>
            ) : (
              <motion.div
                className="relative bg-card/50 backdrop-blur-xl p-8 rounded-3xl border border-accent/20 shadow-2xl shadow-accent/10 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.h2 
                  className="text-3xl font-bold text-foreground mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Request Submitted
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Thank you for your interest in KNEW. We'll review your request and get back to you soon.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link to="/login">
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      Back to Login
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
