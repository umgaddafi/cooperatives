
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Sparkles, Mail, Lock, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SystemSettings } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  useEffect(() => { fetch('/api/settings').then(r => r.ok ? r.json() : null).then(setSettings).catch(() => {}); }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({ variant: "destructive", title: "Error", description: "All fields are required." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed');

      toast({ 
        title: "Registration Successful", 
        description: "Your account is awaiting administrator approval. You will be able to login once approved." 
      });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = settings?.branding?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo')?.imageUrl || null;
  const systemName = settings?.branding?.systemName || 'CoopNest';

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50/30 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-emerald-100/50 shadow-2xl bg-white/90 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
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
              <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tighter">Join {systemName}</CardTitle>
              <CardDescription className="text-base font-medium text-slate-500 px-4">
                Apply for membership to access the cooperative portal.
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4 px-10">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-800 font-black ml-1 uppercase text-[10px] tracking-widest">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="name"
                    placeholder="Kenneth Salihu" 
                    className="h-14 pl-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-emerald-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-800 font-black ml-1 uppercase text-[10px] tracking-widest">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="salejohn@society.com" 
                    className="h-14 pl-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-emerald-500"
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
                    className="h-14 pl-12 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-emerald-500"
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
                className="w-full h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-200 transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Submit Application
                  </span>
                )}
              </Button>
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-xs text-slate-500 font-medium">
                  Already a member? <Link href="/login" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
                </p>
                <div className="flex items-center gap-1.5 opacity-40">
                  <Heart className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Mutual Prosperity</span>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
