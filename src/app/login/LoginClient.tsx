"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Mail, Key, ShieldAlert, ArrowLeft, Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleDemoFill = () => {
    setEmail("admin@shim.app");
    setPassword("admin123");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 relative flex font-sans overflow-hidden bg-black">
      {/* Full-bleed Background Split */}
      <div className="absolute inset-0 flex pointer-events-none z-0">
        <motion.div 
          className="w-full lg:w-1/2 bg-white ml-auto"
          initial={{ x: "10%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        ></motion.div>
      </div>

      {/* Constrained Content matching Navbar */}
      <div className="w-full px-4 sm:px-6 flex relative z-10 max-w-7xl mx-auto">
        
        {/* Left Column: Visual Side (Black) */}
        <motion.div 
          className="hidden lg:flex w-1/2 flex-col justify-between py-12 pr-12 lg:py-16 lg:pr-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative z-10 flex flex-col items-start w-full h-10">
            {/* Spacer */}
          </div>

          <div className="relative z-10 w-full max-w-lg my-auto">
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter uppercase">
            The standard for modern credentials.
          </h1>
          <p className="text-gray-400 text-base lg:text-lg mb-10 leading-relaxed font-medium">
            Generate, distribute, and verify thousands of digital certificates in seconds. Secured by cryptographic ledgers.
          </p>

          <div className="flex flex-col gap-5">
            {[
              "Cryptographically secured records",
              "Instant QR-code validation",
              "Bulk data import via JSON/CSV",
              "Tamper-proof audit logs"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-white group cursor-default w-fit">
                <div className="w-8 h-8 bg-white text-black flex items-center justify-center border-2 border-white group-hover:bg-black group-hover:text-white transition-colors">
                  <CheckCircle2 size={16} className="stroke-[3]" />
                </div>
                <span className="font-bold text-xs lg:text-sm uppercase tracking-widest group-hover:text-gray-300 transition-colors">{feature}</span>
              </div>
            ))}
          </div>
        </div>

          <div className="relative z-10 text-gray-600 font-bold text-[0.65rem] lg:text-xs mt-8 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} shim Digital Platform
          </div>
        </motion.div>

        {/* Right Column: Form Side (White) */}
        <motion.div 
          className="w-full lg:w-1/2 flex flex-col justify-between items-center py-6 lg:py-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Top: Back Link */}
          <div className="w-full flex justify-start pl-0 lg:pl-16">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-widest">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Center: Form Box */}
        <div className="w-full max-w-[400px] my-auto">
          <div className="bg-white border-4 border-black relative">
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-black text-black tracking-tighter uppercase mb-2">Welcome Back</h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Access your organizer dashboard.</p>
              </div>

              {/* Demo Access Card */}
              <div className="border-4 border-black p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white relative z-10 group hover:bg-black transition-colors">
                <div>
                  <div className="text-[0.65rem] font-black text-black group-hover:text-white uppercase tracking-widest mb-1 transition-colors">Demo Access</div>
                  <div className="text-sm font-bold text-gray-500 group-hover:text-gray-400 font-mono transition-colors">admin@shim.app</div>
                </div>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="bg-black hover:bg-white text-white hover:text-black border-2 border-black transition-colors py-1.5 px-4 text-xs font-bold uppercase tracking-widest"
                >
                  Auto-fill
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 mb-6 text-xs bg-black text-white font-bold uppercase tracking-widest">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[0.65rem] font-bold text-black uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email" 
                      className="w-full bg-transparent border-2 border-black text-black rounded-none px-3 py-2.5 pl-10 focus:outline-none focus:ring-0 focus:border-black transition-all placeholder:text-gray-300 font-mono text-sm font-bold" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@shim.app"
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
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  <span>{loading ? "Authenticating..." : "Sign In"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest">
            No account?{" "}
            <Link href="/register" className="text-black border-b-2 border-black hover:bg-black hover:text-white transition-colors p-1 ml-1">
              Create One
            </Link>
        </div>
        </motion.div>
      </div>
    </div>
  );
}
