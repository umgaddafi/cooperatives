
"use client"

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, SystemSettings } from '@/lib/types';
import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Mail, Menu, LogOut, ChevronRight, LayoutDashboard, Wallet, Users, CreditCard, Search, ShieldAlert, Settings, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const userProfile = user;
  const profileLoading = authLoading;
  useEffect(() => { Promise.all([fetch('/api/auth/me'), fetch('/api/settings')]).then(async ([u, s]) => { const ud = await u.json(); setUser(ud.user); if (s.ok) setSettings(await s.json()); }).finally(() => setAuthLoading(false)); }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.role as UserRole);
      localStorage.setItem('coopnest_role', userProfile.role);
    } else if (!profileLoading && user) {
      setRole('MEMBER');
    }
  }, [userProfile, profileLoading, user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('coopnest_role');
    router.push('/login');
  };

  const systemName = settings?.branding?.systemName || 'CoopNest';
  const logoUrl = settings?.branding?.logoUrl || PlaceHolderImages.find(img => img.id === 'logo')?.imageUrl || null;

  if (authLoading || (user && !role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 relative">
           {logoUrl ? (
             <img src={logoUrl} alt="Loading" className="w-full h-full object-contain animate-bounce" />
           ) : (
             <ShieldCheck className="w-full h-full text-emerald-600 animate-bounce" />
           )}
        </div>
        <p className="font-black text-slate-800 tracking-tighter text-xl">Securing session...</p>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['PRESIDENT', 'ASSISTANT_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'AUDITOR', 'MEMBER'] },
    { name: 'My Wealth', href: '/dashboard/savings', icon: Wallet, roles: ['MEMBER'] },
    { name: 'Registry', href: '/dashboard/members', icon: Users, roles: ['PRESIDENT', 'ASSISTANT_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'AUDITOR'] },
    { name: 'Treasury', href: '/dashboard/treasury', icon: CreditCard, roles: ['PRESIDENT', 'TREASURER'] },
    { name: 'Audit Hub', href: '/dashboard/audit', icon: Search, roles: ['PRESIDENT', 'AUDITOR'] },
    { name: 'Governance', href: '/dashboard/governance', icon: ShieldAlert, roles: ['PRESIDENT', 'SECRETARY_GENERAL'] },
    { name: 'System Settings', href: '/dashboard/settings', icon: Settings, roles: ['PRESIDENT'] },
  ];

  const filteredItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-white">
      <DashboardSidebar role={role || 'MEMBER'} systemName={systemName} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-emerald-50 bg-white/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-10 sticky top-0 z-[100]">
          <div className="flex items-center gap-6">
             <div className="md:hidden flex items-center gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="p-3 text-emerald-950 hover:bg-emerald-50 rounded-2xl transition-all active:scale-95 bg-slate-50">
                      <Menu className="w-8 h-8" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-full p-0 bg-white border-none z-[200]">
                    <div className="flex flex-col h-full bg-white">
                      <SheetHeader className="p-8 text-left border-b border-emerald-50 bg-white">
                        <SheetTitle className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-200 shrink-0 overflow-hidden">
                             {logoUrl ? (
                               <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                             ) : (
                               <ShieldCheck className="w-7 h-7 text-white" />
                             )}
                          </div>
                          <span className="text-2xl font-headline font-black tracking-tighter text-emerald-950">{systemName}</span>
                        </SheetTitle>
                        <SheetDescription className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-2">
                          Society Governance Portal
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex flex-col h-[calc(100vh-160px)] justify-between p-6 bg-white overflow-y-auto">
                        <nav className="space-y-2">
                          {filteredItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                  "flex items-center justify-between px-5 py-4 text-base font-black rounded-2xl transition-all duration-300",
                                  isActive 
                                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200" 
                                    : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                                )}
                              >
                                <div className="flex items-center gap-5">
                                  <item.icon className={cn("w-6 h-6", isActive ? "text-white" : "text-slate-400")} />
                                  {item.name}
                                </div>
                                {isActive && <ChevronRight className="w-5 h-5" />}
                              </Link>
                            );
                          })}
                        </nav>
                        <button 
                          onClick={handleLogout}
                          className="flex items-center gap-5 px-6 py-5 text-base font-black text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all mt-8 border border-slate-100"
                        >
                          <LogOut className="w-6 h-6" />
                          Sign Out Securely
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-100 overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-white" />
                      )}
                   </div>
                  <span className="font-black text-emerald-950 tracking-tighter text-lg">{systemName}</span>
                </div>
             </div>
             <div className="hidden md:flex items-center bg-emerald-50 text-emerald-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm">
               {role?.replace('_', ' ')}
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex p-3 rounded-2xl bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all border border-slate-100">
              <Mail className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-2xl bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all relative border border-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            </button>
            <div className="flex items-center gap-3 ml-2 group cursor-pointer" onClick={handleLogout}>
              <Avatar className="h-12 w-12 border-2 border-emerald-500 p-0.5 shadow-md">
                <AvatarImage src={`https://picsum.photos/seed/${user?.id}/200/200`} alt="Profile" className="rounded-full" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-black">
                  {user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-black text-slate-900 leading-none">{userProfile?.name || 'Fellow Member'}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest group-hover:text-red-500 transition-colors">Log Out</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-10 overflow-auto pb-32 md:pb-10 bg-slate-50/30">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
