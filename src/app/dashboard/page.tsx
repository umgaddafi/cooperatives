"use client"

import { useEffect, useState } from 'react';
import { UserRole, SystemSettings, Loan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CreditCard, 
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ChevronDown,
  FileText,
  Calendar,
  Wallet,
  TrendingUp,
  Scale,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDatabase, useDoc, useCollection, useMemoData, useUser, doc, query, collection, where, updateDoc, errorEmitter, DatabasePermissionError } from '@/lib/mysql-client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { sendGuarantorRequest } from '@/ai/flows/guarantor-notification-flow';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

export default function DashboardOverview() {
  const [role, setRole] = useState<UserRole | null>(null);
  const { user } = useUser();
  const db = useDatabase();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const settingsRef = useMemoData(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

  const userProfileRef = useMemoData(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc<any>(userProfileRef);

  const pendingNotifQuery = useMemoData(() => {
    if (!db) return null;
    return query(collection(db, 'loans'), where('status', '==', 'AWAITING_NOTIFICATION_APPROVAL'));
  }, [db]);
  const { data: pendingNotifications } = useCollection<Loan>(pendingNotifQuery);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('coopnest_role') as UserRole;
      setRole(storedRole || 'MEMBER');
    }
  }, []);

  const handleApproveNotification = (loan: Loan) => {
    if (!db || !settings) return;
    setProcessingId(loan.id);

    const runNotification = async () => {
      try {
        if (loan.guarantors) {
          for (const g of loan.guarantors) {
            await sendGuarantorRequest({
              memberName: loan.memberName,
              guarantorName: g.name,
              guarantorEmail: `${g.userId.toLowerCase()}@society.com`,
              loanAmount: loan.amount,
              systemName: settings.branding?.systemName || 'CoopNest'
            });
          }
        }

        const loanRef = doc(db, 'loans', loan.id);
        const updateData = {
          status: 'AWAITING_GUARANTORS',
          notificationsSentAt: new Date().toISOString()
        };

        updateDoc(loanRef, updateData)
          .then(() => {
            toast({ title: "Guarantors Notified", description: `Authorizations sent for ${loan.memberName}'s loan application.` });
          })
          .catch(async (e) => {
            errorEmitter.emit('permission-error', new DatabasePermissionError({
              path: loanRef.path,
              operation: 'update',
              requestResourceData: updateData
            }));
          });

      } catch (e: any) {
        toast({ variant: "destructive", title: "Notification Error", description: e.message });
      } finally {
        setProcessingId(null);
      }
    };

    runNotification();
  };

  if (!role) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-10 md:p-14 text-white shadow-2xl shadow-emerald-200/50"
      >
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-black font-headline leading-[1.15]">
            Welcome back, {userProfile?.name?.split(' ')[0] || 'Member'}
          </h1>
          <p className="text-xl text-emerald-50 font-medium leading-relaxed opacity-90">
            Driving collective wealth through ethical governance and mutual society prosperity.
          </p>
        </div>
        
        <div className="absolute right-12 bottom-0 w-1/3 h-full hidden lg:block opacity-90">
          <img 
            src="https://picsum.photos/seed/coophero/600/400" 
            alt="Society Impact" 
            className="w-full h-full object-cover rounded-t-3xl border-x-8 border-t-8 border-white/10"
          />
        </div>
        <Scale className="absolute top-10 left-1/2 opacity-10 w-24 h-24" />
        <Calendar className="absolute bottom-10 right-10 opacity-10 w-24 h-24" />
      </motion.div>

      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row items-center justify-between p-6 bg-emerald-50/30 border-2 border-emerald-100 rounded-3xl"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-0">
          <h2 className="font-extrabold text-lg text-slate-800">Registry Standing</h2>
          <span className="text-emerald-600 font-black text-sm">ID: {userProfile?.memberId || 'MB-0000'}</span>
          <span className="text-slate-500 text-sm font-medium">| Status: {userProfile?.status || 'Active'}</span>
        </div>
        <Button variant="outline" className="rounded-full gap-2 border-emerald-500 text-emerald-700 hover:bg-emerald-600 hover:text-white bg-white px-8 h-12 text-base font-bold transition-all">
          <FileText className="w-5 h-5" /> Society Bylaws
        </Button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <StatCard 
          title="Personal Pool" 
          value={`₦${(userProfile?.totalSavings || 0).toLocaleString()}`} 
          subtitle="Collective Asset Contribution"
          icon={Wallet} 
          className="bg-emerald-600 text-white" 
          showBadge
        />
        <StatCard 
          title="Credit Status" 
          value="3x Multiplier" 
          subtitle="Qualified Financial Leverage"
          icon={TrendingUp} 
          className="bg-slate-900 text-white" 
          watermark={TrendingUp}
        />
        <StatCard 
          title="Dividend Forecast" 
          value="Calculated Annually" 
          subtitle="Pro-rata Surplus Distribution"
          icon={CheckCircle2} 
          className="bg-orange-500 text-white md:col-span-2" 
        />
      </motion.div>

      {role === 'PRESIDENT' && pendingNotifications && pendingNotifications.length > 0 && (
        <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black text-slate-900">Governance Workflow</CardTitle>
            <CardDescription className="text-base">Review and authorize guarantor notifications for credit applications.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {pendingNotifications.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-black text-xl text-slate-900">{loan.memberName}</p>
                    <p className="text-slate-500 font-medium">₦{loan.amount.toLocaleString()} Asset Financing Request</p>
                  </div>
                </div>
                <Button 
                  size="lg"
                  disabled={processingId === loan.id}
                  onClick={() => handleApproveNotification(loan)}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-14 shadow-lg"
                >
                  {processingId === loan.id ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Notify Guarantors'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  className,
  showBadge = false,
  watermark: Watermark
}: { 
  title: string, 
  value: string, 
  subtitle?: string,
  icon: any, 
  className?: string,
  showBadge?: boolean,
  watermark?: any
}) {
  return (
    <motion.div variants={itemVariants} className={cn("relative p-10 rounded-[2.5rem] shadow-2xl flex items-center justify-between overflow-hidden group", className)}>
      <div className="flex items-center gap-8 relative z-10">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-black font-headline tracking-tight">{title}</p>
          <p className="text-lg font-bold opacity-90">{value}</p>
          {subtitle && <p className="text-sm font-bold opacity-80 uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      
      {showBadge && (
        <div className="bg-white/20 p-6 rounded-3xl relative z-10 backdrop-blur-md border border-white/20">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      )}

      {Watermark && (
        <Watermark className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 text-white transition-transform group-hover:scale-110 duration-500" />
      )}
    </motion.div>
  );
}
