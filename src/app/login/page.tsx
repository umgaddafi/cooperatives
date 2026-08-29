
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Sparkles, Mail, Lock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SystemSettings } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  useEffect(() => { fetch('/api/settings').then(r => r.ok ? r.json() : null).then(setSettings).catch(() => {}); }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Credentials", description: "Please enter both email and password." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Authentication failed');
      toast({ title: "Portal Access Granted", description: `Welcome back, ${email}.` });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: error.message.includes('auth/invalid-credential') 
          ? "The credentials provided do not match our records." 
          : "Authentication failed. Please check your connection."
      });
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = settings?.branding?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo')?.imageUrl || null;
  const systemName = settings?.branding?.systemName || 'CoopNest';

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/40 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.08] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500 rounded-full blur-[180px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-emerald-100/50 shadow-2xl bg-white/95 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
          <CardHeader className="space-y-4 text-center pt-12">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={systemName} className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tighter">{systemName}</CardTitle>
              <CardDescription className="text-base font-medium text-slate-500 px-4">
                Enter your credentials to access the secure governance dashboard.
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-800 font-black ml-1 uppercase text-[10px] tracking-widest">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="member@css.com" 
                    className="h-14 pl-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-emerald-500 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-800 font-black ml-1 uppercase text-[10px] tracking-widest">Secure Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="••••••••" 
                    className="h-14 pl-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-emerald-500 transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-10 pb-12 pt-4 flex flex-col gap-6">
              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-80"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Authenticate Access
                  </span>
                )}
              </Button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-xs text-slate-500 font-medium">
                  New member? <Link href="/register" className="text-emerald-600 font-bold hover:underline">Apply for Membership</Link>
                </p>
                <div className="flex items-center gap-1.5 opacity-40 mt-2">
                  <Heart className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Mutual Success</span>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
