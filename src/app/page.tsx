import Link from "next/link";
import { 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  BookOpen, 
  FileSpreadsheet, 
  Stamp, 
  Lock,
  Sparkles,
  Zap
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LiveSpecimenCarousel from "@/components/LiveSpecimenCarousel";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  const sampleCertificateId = "cmtzoowrv0008585767kqhhyk";

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Modern Hero Section */}
      <main className="flex-1 relative overflow-hidden bg-black text-white border-b-4 border-black">
        {/* Subtle grid pattern background matching verify page */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <section className="max-w-7xl mx-auto px-6 py-32 relative z-10 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Hero Content */}
            <div className="flex flex-col gap-8">
              <h1 className="text-6xl lg:text-7xl font-extrabold text-white leading-none tracking-tighter uppercase">
                Beautiful<br/>
                Certificates.<br/>
                Verified.
              </h1>

              <p className="text-xl font-medium text-gray-400 leading-relaxed max-w-lg uppercase tracking-widest text-sm">
                Stop manually generating PDFs. shim automates stunning, QR-secured credentials for your webinars, summits, and hackathons in minutes.
              </p>

              {/* Action Bar - Replaced Verify with Organizer CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/register" className="bg-white hover:bg-gray-200 text-black font-bold border-4 border-white py-4 px-10 text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  Start Designing For Free
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            {/* Right Hero Visuals */}
            <div className="relative">
              <div className="p-8 bg-black border-4 border-gray-800 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-widest uppercase">LIVE SPECIMEN</span>
                  </div>
                  <span className="text-[0.65rem] uppercase tracking-widest border-2 border-gray-700 text-gray-300 px-3 py-1 font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> Secured
                  </span>
                </div>

                <div className="pointer-events-none bg-white p-2 border-2 border-gray-800 shadow-2xl">
                  <LiveSpecimenCarousel />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-black py-32 border-t-4 border-gray-900 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="text-5xl font-bold text-white mb-6 tracking-tighter uppercase">Everything You Need<br/>To Issue At Scale</h2>
              <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto uppercase tracking-widest text-sm">From intimate seminars to global conventions, our infrastructure handles your certification needs effortlessly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: BookOpen, title: "Visual Designer", desc: "Drag & drop builder to design stunning certificates that match your event's branding." },
                { icon: Stamp, title: "Multi-Role Support", desc: "Instantly segment and issue different designs for Speakers, Attendees, and Sponsors." },
                { icon: FileSpreadsheet, title: "Bulk Generation", desc: "Upload a CSV and generate thousands of personalized certificates in seconds." },
                { icon: ShieldCheck, title: "One-Click Verify", desc: "Embedded QR codes allow anyone to instantly verify a credential's authenticity." }
              ].map((feature, idx) => (
                <div key={idx} className="p-8 bg-black border-4 border-gray-800 hover:border-gray-500 transition-colors duration-300 group">
                  <div className={`w-14 h-14 flex items-center justify-center mb-8 border-2 border-gray-700 bg-gray-900 text-white group-hover:bg-white group-hover:text-black transition-colors`}>
                    <feature.icon size={28} />
                  </div>
                  <h3 className="font-bold text-white text-xl mb-4 uppercase tracking-wide">{feature.title}</h3>
                  <p className="text-gray-400 text-sm font-medium leading-relaxed uppercase tracking-widest">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-black relative overflow-hidden border-t-4 border-gray-900">
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-block mb-6 border-2 border-gray-700 bg-gray-900 px-4 py-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Ready to upgrade?
              </span>
            </div>
            <h2 className="text-6xl font-bold text-white mb-8 tracking-tighter uppercase">Stop Wasting Time<br/>On Manual PDFs.</h2>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-medium mb-12 max-w-2xl mx-auto">Join hundreds of modern event organizers using shim to streamline their post-event credentialing.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/register" className="bg-white text-black font-bold border-4 border-white py-4 px-10 text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors w-full sm:w-auto">
                Start for free
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
