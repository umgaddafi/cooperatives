"use client"

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck,
  BadgePlus,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useDatabase, useDoc, useMemoData, useUser, doc, addDoc, collection, errorEmitter, DatabasePermissionError } from '@/lib/mysql-client';
import { SystemSettings } from '@/lib/types';

export default function MemberSavings() {
  const { toast } = useToast();
  const db = useDatabase();
  const { user } = useUser();
  const [mandateSuccess, setMandateSuccess] = useState(false);
  const [isRequestingLoan, setIsRequestingLoan] = useState(false);

  const settingsRef = useMemoData(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: settings } = useDoc<SystemSettings>(settingsRef);

  const [loanRequest, setLoanRequest] = useState({
    loanTypeId: '',
    amount: 0,
    guarantorIds: [] as string[]
  });

  const selectedLoanType = useMemo(() => 
    settings?.loanTypes?.find(t => t.id === loanRequest.loanTypeId), 
  [settings, loanRequest.loanTypeId]);

  const handleLinkCard = () => {
    toast({ title: "Initializing Paystack...", description: "Securely linking your bank-grade account." });
    setTimeout(() => {
      setMandateSuccess(true);
      toast({
        title: "Mandate Created Successfully",
        description: "Your monthly contribution will be debited automatically.",
      });
    }, 2000);
  };

  const submitLoanRequest = () => {
    if (!db || !selectedLoanType || !user) return;
    setIsRequestingLoan(true);

    const loanCollection = collection(db, 'loans');
    const payload = {
      userId: user.uid,
      memberName: user.displayName || 'Member',
      amount: loanRequest.amount,
      loanTypeId: loanRequest.loanTypeId,
      status: 'AWAITING_NOTIFICATION_APPROVAL',
      createdAt: new Date().toISOString(),
      guarantors: loanRequest.guarantorIds.map(id => ({
        userId: id,
        name: `Guarantor ${id}`,
        status: 'PENDING',
        notifiedAt: null
      }))
    };

    addDoc(loanCollection, payload)
      .then(() => {
        toast({ title: "Request Submitted", description: "The President must approve sending notifications to your nominated guarantors." });
        setIsRequestingLoan(false);
      })
      .catch(async (e) => {
        setIsRequestingLoan(false);
        errorEmitter.emit('permission-error', new DatabasePermissionError({
          path: loanCollection.path,
          operation: 'create',
          requestResourceData: payload
        }));
      });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Personal Wealth</h1>
          <p className="text-muted-foreground">Your contribution history and mandate settings.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <Dialog>
             <DialogTrigger asChild>
               <Button className="flex-1 sm:flex-none gap-2 shadow-lg shadow-primary/20">
                <BadgePlus className="w-4 h-4" /> Request Loan
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-md bg-slate-900 border-white/10">
               <DialogHeader>
                 <DialogTitle>Apply for Loan</DialogTitle>
                 <DialogDescription>Select a product and add the required guarantors.</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                 <div className="space-y-2">
                   <Label>Loan Type</Label>
                   <select 
                     className="w-full bg-white/5 border border-white/10 rounded-md p-2 text-sm"
                     value={loanRequest.loanTypeId}
                     onChange={(e) => setLoanRequest({...loanRequest, loanTypeId: e.target.value})}
                   >
                     <option value="">Select Product...</option>
                     {settings?.loanTypes?.map(t => (
                       <option key={t.id} value={t.id}>{t.name} ({t.interestRate}%)</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label>Amount (₦)</Label>
                   <Input 
                    type="number" 
                    placeholder="50,000" 
                    className="bg-white/5 border-white/10"
                    onChange={(e) => setLoanRequest({...loanRequest, amount: Number(e.target.value)})}
                   />
                 </div>
                 {selectedLoanType && (
                   <div className="space-y-2">
                     <Label>Guarantors Required: {selectedLoanType.guarantorsRequired}</Label>
                     {Array.from({ length: selectedLoanType.guarantorsRequired }).map((_, i) => (
                       <Input 
                         key={i}
                         placeholder={`Enter Guarantor Member ID ${i+1}`} 
                         className="bg-white/5 border-white/10 mb-2"
                         onChange={(e) => {
                            const newIds = [...loanRequest.guarantorIds];
                            newIds[i] = e.target.value;
                            setLoanRequest({...loanRequest, guarantorIds: newIds});
                         }}
                       />
                     ))}
                   </div>
                 )}
               </div>
               <DialogFooter>
                 <Button onClick={submitLoanRequest} disabled={!selectedLoanType || isRequestingLoan} className="w-full">
                    {isRequestingLoan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Admin Review'}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
           {!mandateSuccess && (
             <Button onClick={handleLinkCard} variant="outline" className="flex-1 sm:flex-none gap-2">
              <CreditCard className="w-4 h-4" /> Link Card
             </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-card/50 border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Wallet className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Accumulated Savings</CardTitle>
            <div className="text-4xl font-bold font-headline mt-2">₦450,000.00</div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               <div className="flex justify-between text-xs font-medium">
                 <span className="text-muted-foreground">Savings Goal: House Project</span>
                 <span className="text-accent">45% Complete</span>
               </div>
               <Progress value={45} className="h-2 bg-white/5" />
             </div>
             <div className="grid grid-cols-2 gap-4 mt-6">
               <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                 <p className="text-xs text-muted-foreground mb-1">Monthly Mandate</p>
                 <p className="text-lg font-bold">₦10,000</p>
               </div>
               <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                 <p className="text-xs text-muted-foreground mb-1">Last Contribution</p>
                 <p className="text-lg font-bold">Jan 28, 2025</p>
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-xl flex flex-col justify-between">
          <CardHeader>
             <CardTitle className="font-headline font-bold text-lg">Payment Mandate</CardTitle>
             <CardDescription>Secure tokenization via Paystack.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center space-y-4">
            {mandateSuccess ? (
              <>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-accent" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Active Mandate</p>
                  <p className="text-xs text-muted-foreground">Visa Ending in 4242</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-primary" />
                </div>
                <Button onClick={handleLinkCard} variant="secondary" className="w-full">Link Card Now</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-white/5 shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline font-bold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'Monthly Contribution', amount: '₦10,000', date: 'Jan 28, 2025', status: 'SUCCESS' },
              { type: 'Monthly Contribution', amount: '₦10,000', date: 'Dec 28, 2024', status: 'SUCCESS' },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <ArrowUpRight className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{tx.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
