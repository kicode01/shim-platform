"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserPlus, Mail, Key, User, ShieldAlert, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, Zap, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to register account.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 relative flex font-sans overflow-hidden bg-black">
      {/* Full-bleed Background Split */}
      <div className="absolute inset-0 flex pointer-events-none z-0">
        <motion.div 
          className="w-full lg:w-1/2 bg-white mr-auto"
          initial={{ x: "-10%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        ></motion.div>
      </div>

      {/* Constrained Content matching Navbar */}
      <div className="w-full px-4 sm:px-6 flex relative z-10 max-w-7xl mx-auto">
        
        {/* Left Column: Form Side (White) */}
        <motion.div 
          className="w-full lg:w-1/2 flex flex-col justify-between items-center py-6 lg:py-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Top: Back Link */}
          <div className="w-full flex justify-start pr-0 lg:pr-16">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Center: Form Box */}
        <div className="w-full max-w-[400px] my-auto">
          <div className="bg-white border-4 border-black relative">
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-black text-black tracking-tighter uppercase mb-2">Create Account</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Join the standard in digital credentials.</p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 mb-6 text-xs bg-black text-white font-bold uppercase tracking-widest">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[0.65rem] font-bold text-black uppercase tracking-widest mb-1.5">Full Name or Organization</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-2 border-black text-black rounded-none px-3 py-2.5 pl-10 focus:outline-none focus:ring-0 focus:border-black transition-all placeholder:text-gray-300 font-bold text-sm" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe / Tech Corp"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.65rem] font-bold text-black uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email" 
                      className="w-full bg-transparent border-2 border-black text-black rounded-none px-3 py-2.5 pl-10 focus:outline-none focus:ring-0 focus:border-black transition-all placeholder:text-gray-300 font-mono text-sm font-bold" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@shim.app"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[0.65rem] font-bold text-black uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full bg-transparent border-2 border-black text-black rounded-none px-3 py-2.5 pl-10 pr-10 focus:outline-none focus:ring-0 focus:border-black transition-all placeholder:text-gray-300 font-mono text-sm tracking-widest font-bold" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black hover:text-gray-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border-4 border-black font-bold rounded-none py-3 mt-2 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  <span>{loading ? "Creating..." : "Create Account"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest">
            Already have an account?{" "}
            <Link href="/login" className="text-black border-b-2 border-black hover:bg-black hover:text-white transition-colors p-1 ml-1">
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Right Column: Visual Side (Black) */}
        <motion.div 
          className="hidden lg:flex w-1/2 flex-col justify-between py-12 pl-12 lg:py-16 lg:pl-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative z-10 flex flex-col items-end w-full h-10">
            {/* Spacer */}
          </div>

          <div className="relative z-10 w-full max-w-lg my-auto self-end text-right">
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter uppercase">
            Stop sending unverified PDFs.
          </h1>
          <p className="text-gray-400 text-base lg:text-lg mb-10 leading-relaxed ml-auto font-medium">
            Give your participants credentials they can be proud of, backed by immutable audit logs and instant QR verification.
          </p>

          <div className="flex flex-col items-end gap-5">
            {[
              "Visual template designer",
              "1-click batch generation",
              "Public verification portal",
              "Role-based multi-credential support"
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-end gap-4 text-white group cursor-default">
                <span className="font-bold text-xs lg:text-sm uppercase tracking-widest group-hover:text-gray-300 transition-colors">{feature}</span>
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center border-2 border-white group-hover:bg-black group-hover:text-white transition-colors">
                  <CheckCircle2 size={16} className="stroke-[3]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-gray-600 font-bold text-[0.65rem] lg:text-xs mt-8 text-right tracking-widest uppercase">
          &copy; {new Date().getFullYear()} shim Digital Platform
        </div>
        </motion.div>
      </div>
    </div>
  );
}
