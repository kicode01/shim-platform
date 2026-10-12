"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  Layout, 
  Users, 
  Upload, 
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import LiveSpecimenCarousel from "@/components/LiveSpecimenCarousel";

export default function HomeClient() {
  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      {/* Modern Hero Section.
          No `overflow-y-auto` here: the root <main data-app-scroll> in
          layout.tsx is the single scroll container for the whole app. A second
          scroller nested inside it produced two stacked scrollbars and let the
          inner one fall back to the unstyled native OS scrollbar. Letting this
          section grow to its natural height keeps exactly one scrollbar on
          screen, and it is the correctly themed one. */}
      <main className="flex-1 relative bg-[#0a0a0a] text-zinc-100">
        
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Hero Content */}
            <motion.div 
              className="flex flex-col gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-zinc-50 leading-tight">
                Beautiful<br/>
                Certificates.<br/>
                Verified.
              </h1>

              <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
                Stop manually generating PDFs. shim automates stunning, QR-secured credentials for your webinars, summits, and hackathons in minutes.
              </p>

              {/* Action Bar - Multi-domain CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/login" className="bg-zinc-100 hover:bg-white text-zinc-800 font-medium rounded-md py-3 px-8 transition-colors flex items-center justify-center gap-2 w-fit group">
                  Get Started
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Right Hero Visuals */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-xl relative group">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-zinc-500 animate-pulse rounded-full" />
                    <span className="text-sm font-medium text-zinc-500">Live Preview</span>
                  </div>
                </div>

                <div className="pointer-events-none bg-white p-2 border border-zinc-200 rounded shadow-2xl">
                  <LiveSpecimenCarousel />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-[#0a0a0a] py-32 border-t border-zinc-900 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-semibold text-zinc-50 mb-4 tracking-tight">Built for organizers and attendees.</h2>
              <p className="text-zinc-400 text-lg max-w-xl">Simple tools to issue credentials, and a beautiful portal for your attendees to claim and showcase them.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { icon: Layout, title: "Custom Design", desc: "Build beautiful certificates that match your brand. No design experience required." },
                { icon: Users, title: "Role-based Issuance", desc: "Easily segment attendees, speakers, and sponsors with dynamic templates." },
                { icon: Upload, title: "Bulk Issuance", desc: "Upload your attendee list and issue thousands of credentials instantly." },
                { icon: CheckCircle, title: "Instant Verification", desc: "Every certificate includes a unique QR code for immediate authenticity checks." }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx} 
                  className="mob-feature group"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <div className={`w-10 h-10 flex items-center justify-center mb-6 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-zinc-200 transition-colors`}>
                    <feature.icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-zinc-100 text-lg mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-[#0a0a0a] relative overflow-hidden border-t border-zinc-900">
          <motion.div 
            className="max-w-4xl mx-auto px-6 relative z-10 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl font-semibold text-zinc-50 mb-6 tracking-tight">Issue your first credential today.</h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">Join the organizers using shim to modernize their event experience.</p>
            <div className="flex items-center justify-center">
              <Link href="/register" className="bg-zinc-100 text-zinc-900 text-sm font-medium py-3 px-8 rounded-md hover:bg-white transition-colors">
                Create an account
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
