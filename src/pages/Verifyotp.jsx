import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ShieldCheck } from "lucide-react";

const Verifyotp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim() || otp.trim().length !== 6) {
      toast.error("Enter your email and the 6-digit OTP");
      return;
    }
    setLoading(true);

    try {
      const result = await api.auth.verifyOtp(email, otp);

      api.auth.saveSession(result);
      api.auth.setWelcomeModal(true);
      await checkUserAuth();

      toast.success("Email verified successfully 🎉");

      setTimeout(() => {
        navigate("/personal", { state: { showWelcome: true } });
      }, 800);
    } catch (err) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(58,86,194,0.16),transparent_55%)]" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <Card className="card-surface relative w-full max-w-md overflow-hidden rounded-3xl">
        <div className="px-6 py-7 sm:px-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b7ad4] via-[#3a56c2] to-[#1e2d63] text-[#ffffff] shadow-[0_10px_30px_-10px_rgba(58,86,194,0.8)]"><ShieldCheck className="h-6 w-6" /></div>
          <p className="eyebrow mb-2">Verification</p>
          <CardTitle className="font-display text-3xl font-normal tracking-tight">Verify your email</CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">One quick step before you enter your workspace.</p>
        </div>
        <CardHeader className="px-6 pb-2 pt-0 sm:px-8"><div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-sm"><Mail className="h-4 w-4 text-primary" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Code sent to</p><p className="truncate text-sm font-medium">{email || "your email address"}</p></div></div></CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="verify-email" className="text-xs font-semibold">Email address</Label><Input id="verify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" /></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="verify-otp" className="text-xs font-semibold">6-digit verification code</Label><span className="text-xs text-muted-foreground">Expires in 5 min</span></div><Input id="verify-otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} className="h-14 text-center text-2xl font-semibold tracking-[0.45em]" /></div>
            <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>{loading ? "Verifying..." : "Verify email"}</Button>
            <p className="text-center text-xs text-muted-foreground">Didn't receive the code? Check your spam folder or request a new signup email.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verifyotp;
