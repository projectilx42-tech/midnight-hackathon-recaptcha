"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  EyeOff, 
  Cpu, 
  Globe,
  Terminal,
  Layers,
  Fingerprint,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// --- Components ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-3" : "bg-transparent py-6"}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center glow-blue">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">HumanProof</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-sm font-medium text-muted-text hover:text-white transition-colors">Architecture</Link>
          <Link href="#" className="text-sm font-medium text-muted-text hover:text-white transition-colors">Security</Link>
          <Link href="#" className="text-sm font-medium text-muted-text hover:text-white transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} className="text-xs text-muted-text border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors rounded-full px-4 py-2 cursor-pointer">
            Unverify
          </button>

          <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-text hover:text-white">
            <Shield className="w-4 h-4 mr-2" />
            GitHub
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-text hover:text-white">
            Demo
          </Button>
          <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full px-5">
            Install Extension
          </Button>
        </div>
      </div>
    </nav>
  );
};

const VerificationMockup = () => {
  const [status, setStatus] = useState("verifying");
  const [hash, setHash] = useState("0x72f9...e10a");

  useEffect(() => {
    const interval = setInterval(() => {
      setHash(Math.random().toString(16).substring(2, 10) + "..." + Math.random().toString(16).substring(2, 6));
    }, 2000);
    
    const timeout = setTimeout(() => {
      setStatus("verified");
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative w-full max-w-[500px] aspect-[4/3] glass rounded-2xl overflow-hidden border-white/10 glow-blue"
    >
      {/* Browser Bar */}
      <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        </div>
        <div className="flex-1 max-w-[300px] bg-white/5 rounded-md px-3 py-1 flex items-center gap-2">
          <Globe className="w-3 h-3 text-muted-text" />
          <span className="text-[10px] text-muted-text truncate">humanproof.io/verify</span>
        </div>
        <div className="w-8" />
      </div>

      {/* Content Area */}
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <AnimatePresence mode="wait">
          {status === "verifying" ? (
            <motion.div 
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  className="w-24 h-24 rounded-full border-2 border-accent/20 flex items-center justify-center relative"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-accent"
                  />
                  <Cpu className="w-10 h-10 text-accent" />
                </motion.div>
              </div>
              <div className="text-center">
                <h4 className="font-heading font-bold text-lg mb-1">Generating Proof</h4>
                <p className="text-xs text-muted-text font-mono uppercase tracking-widest">{hash}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="verified"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-16 h-16 rounded-full bg-accent flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20" />
              </div>
              <div className="text-center">
                <h4 className="font-heading font-bold text-lg mb-1">Humanity Verified</h4>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full border border-accent/20">
                  <Terminal className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] text-accent font-mono uppercase font-bold">ZK-PROOF: VALID</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse delay-150" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const StepCard = ({ number, title, description, icon: Icon, delay }: { number: string, title: string, description: string, icon: any, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="glass border-white/5 p-8 h-full hover:border-accent/30 transition-all duration-300 group">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
        <Icon className="w-6 h-6 text-white/70 group-hover:text-accent transition-colors" />
      </div>
      <div className="text-xs font-mono text-accent mb-2">{number}</div>
      <h3 className="text-xl font-heading font-bold mb-3">{title}</h3>
      <p className="text-sm text-muted-text leading-relaxed">{description}</p>
    </Card>
  </motion.div>
);

const ComparisonRow = ({ label, traditional, humanProof }: { label: string, traditional: string, humanProof: string }) => (
  <TableRow className="border-white/5 hover:bg-white/[0.02] transition-colors">
    <TableCell className="font-medium text-white/70 py-6">{label}</TableCell>
    <TableCell className="text-muted-text py-6">{traditional}</TableCell>
    <TableCell className="text-white font-medium py-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-accent" />
        {humanProof}
      </div>
    </TableCell>
  </TableRow>
);

const STORAGE_KEY = "humanproof_verified_date";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

const VerifyWall = ({ onVerified }: { onVerified: () => void }) => {
  const [status, setStatus] = useState<"idle" | "verifying" | "done">("idle");

  const doVerify = async () => {
    setStatus("verifying");

    const result = await new Promise<{ok: boolean, error?: string, message?: string}>((resolve) => {
      const requestId = Math.random().toString(36).slice(2);

      const handler = (e: Event) => {
        const ce = e as CustomEvent;
        if (ce.detail?.requestId === requestId) {
          document.removeEventListener("humanproof:response", handler);
          clearTimeout(timeout);
          resolve(ce.detail);
        }
      };

      const timeout = setTimeout(() => {
        document.removeEventListener("humanproof:response", handler);
        resolve({ ok: false, error: "TIMEOUT" });
      }, 90000);

      document.addEventListener("humanproof:response", handler);
      document.dispatchEvent(new CustomEvent("humanproof:challenge", { detail: { requestId } }));
    });

    if (!result.ok) {
      const errMap: Record<string, string> = {
        TIMEOUT: "Extension not detected — install HumanProof extension",
        NOT_VERIFIED: "Identity not set up — click the extension → Set up identity",
        NULLIFIER_ALREADY_USED: "Already verified today on this domain",
        BRIDGE_OFFLINE: "Bridge server offline",
      };
      setStatus("idle");
      alert(errMap[result.error ?? ""] || result.message || "Verification failed");
      return;
    }

    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem(STORAGE_KEY, todayUTC());
    setStatus("done");
    setTimeout(onVerified, 400);
  };

  return (
    <motion.div
      key="wall"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050816]"
    >
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 glass border border-white/10 rounded-2xl p-10 max-w-md w-full mx-6 text-center"
      >
        <div className="w-16 h-16 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-accent" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full border border-accent/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] text-accent font-mono uppercase font-bold tracking-widest">Midnight ZK · Demo</span>
        </div>

        <h1 className="text-3xl font-heading font-bold tracking-tight mb-3">Prove you're human.</h1>
        <p className="text-muted-text text-sm leading-relaxed mb-8">
          One-time identity verification. Zero personal data on-chain.<br />
          Powered by zero-knowledge proofs on Midnight.
        </p>

        <div className="space-y-3 mb-8 text-left">
          {["No name, ID number, or biometrics stored", "Nullifier prevents replay attacks", "Works once per domain per day"].map(f => (
            <div key={f} className="flex items-center gap-3 text-sm text-muted-text">
              <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Button
          size="lg"
          onClick={doVerify}
          disabled={status !== "idle"}
          className="w-full bg-accent text-white hover:bg-accent/90 rounded-xl h-14 text-base font-bold"
        >
          {status === "verifying" ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
              Verifying...
            </>
          ) : status === "done" ? (
            <><CheckCircle2 className="w-5 h-5 mr-2" />Verified!</>
          ) : (
            <>Verify<ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>

        <p className="text-[11px] text-muted-text mt-5 font-mono">Built on Midnight Network · MLH Hackathon 2026</p>
      </motion.div>
    </motion.div>
  );
};

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === todayUTC()) {
      setVerified(true);
    }
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#050816]" />;
  }

  return (
    <>
    <AnimatePresence>
      {!verified && <VerifyWall onVerified={() => setVerified(true)} />}
    </AnimatePresence>
    <main className="relative min-h-screen bg-[#050816] overflow-x-hidden selection:bg-accent/30">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid z-0 opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[60%] left-[-10%] w-[500px] h-[500px] bg-accent-purple/5 blur-[150px] rounded-full pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full border border-accent/20 mb-8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] text-accent font-mono uppercase font-bold tracking-widest">Built on Midnight Network</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold tracking-tighter mb-8 leading-[1.1]"
              >
                CAPTCHAs are <br className="hidden md:block" /> broken.
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-text max-w-xl mb-10 leading-relaxed mx-auto lg:mx-0"
              >
                The world’s first privacy-first verification engine. 
                Prove you’re human without revealing your identity. No tracking, 
                no training data, just pure cryptographic proofs.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-14 text-base group">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="ghost" size="lg" className="text-white hover:bg-white/5 rounded-full px-8 h-14 text-base">
                  View Docs
                </Button>
              </motion.div>
            </div>

            <div className="flex-1 w-full flex justify-center">
              <VerificationMockup />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-gradient">How it works</h2>
            <p className="text-muted-text max-w-2xl mx-auto text-lg">
              Seamlessly verify your humanity across the web with a single cryptographic proof.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <StepCard 
              number="01"
              title="Verify once"
              description="Connect your identity provider once to establish humanity without revealing your real name."
              icon={UserCheck}
              delay={0.1}
            />
            <StepCard 
              number="02"
              title="Generate proof"
              description="Your browser generates a local zero-knowledge proof that you are a verified human."
              icon={Layers}
              delay={0.2}
            />
            <StepCard 
              number="03"
              title="Verify anywhere"
              description="Send the proof to any website. One anonymous proof per domain per day, total privacy."
              icon={Globe}
              delay={0.3}
            />
          </div>

          {/* Architecture Pipeline */}
          <div className="max-w-4xl mx-auto glass rounded-2xl p-8 border-white/5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <Globe className="w-6 h-6 text-muted-text" />
                </div>
                <span className="text-[10px] font-mono text-muted-text uppercase">Identity Source</span>
              </div>
              
              <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-accent/50 to-white/5 hidden md:block relative">
                <motion.div 
                  animate={{ left: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-[2px] bg-accent glow-blue shadow-[0_0_10px_#4F8CFF]"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <Layers className="w-6 h-6 text-muted-text" />
                </div>
                <span className="text-[10px] font-mono text-muted-text uppercase">Humanity Proof</span>
              </div>

              <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-accent/50 to-white/5 hidden md:block relative">
                <motion.div 
                  animate={{ left: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-[2px] bg-accent glow-blue shadow-[0_0_10px_#4F8CFF]"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30">
                  <Cpu className="w-6 h-6 text-accent" />
                </div>
                <span className="text-[10px] font-mono text-accent uppercase font-bold">Midnight ZK-ZK</span>
              </div>

              <div className="flex-1 h-px bg-gradient-to-r from-white/5 via-accent/50 to-white/5 hidden md:block relative">
                <motion.div 
                  animate={{ left: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-[2px] bg-accent glow-blue shadow-[0_0_10px_#4F8CFF]"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <span className="text-[10px] font-mono text-accent uppercase font-bold">Verified Human</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-accent/5 opacity-50 z-0" />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-8 text-gradient">Websites know you’re human. <br />Nothing more.</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <EyeOff className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">No PII Required</h4>
                    <p className="text-sm text-muted-text">We don't collect names, emails, or biometric data. Your identity stays with you.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Unlinkable Verification</h4>
                    <p className="text-sm text-muted-text">Proofs are mathematically designed to be unlinkable across different websites.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="glass rounded-2xl overflow-hidden border-white/5">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-white font-bold py-6">Feature</TableHead>
                      <TableHead className="text-white font-bold py-6">Traditional CAPTCHA</TableHead>
                      <TableHead className="text-accent font-bold py-6">HumanProof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <ComparisonRow 
                      label="Privacy" 
                      traditional="IP \u0026 Behavioral Tracking" 
                      humanProof="Zero-Knowledge Proofs" 
                    />
                    <ComparisonRow 
                      label="User Experience" 
                      traditional="Select all traffic lights" 
                      humanProof="One-click / Background" 
                    />
                    <ComparisonRow 
                      label="Data Usage" 
                      traditional="Trains AI models" 
                      humanProof="Encrypted \u0026 Discarded" 
                    />
                    <ComparisonRow 
                      label="Bot Protection" 
                      traditional="Easily bypassed by AI" 
                      humanProof="Cryptographically Secure" 
                    />
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-heading font-bold mb-8 tracking-tighter"
          >
            The future of <br className="hidden md:block" /> human verification.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-text mb-12 max-w-2xl mx-auto"
          >
            Stop trading your privacy for security. Join the network 
            that values your anonymity.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90 rounded-full px-10 h-16 text-lg shadow-lg shadow-accent/20">
              Integrate Now
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/5 border border-white/10 rounded-full px-10 h-16 text-lg">
              <Shield className="w-5 h-5 mr-2" />
              View GitHub
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-accent rounded flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-heading font-bold text-lg">HumanProof</span>
            </div>
            
            <div className="text-sm text-muted-text">
              © 2026 HumanProof. Built on Midnight. All rights reserved.
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-text">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
