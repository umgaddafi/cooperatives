
"use client"

import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp, updateDoc, arrayUnion, useDatabase, useDoc, useMemoData, errorEmitter, DatabasePermissionError } from '@/lib/mysql-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  RefreshCcw,
  Lock,
  Plus,
  Trash2,
  Percent,
  Calculator,
  Mail,
  Palette,
  ShieldCheck,
  Upload,
  Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SystemSettings, LoanType } from '@/lib/types';
import { uploadLogo } from '@/app/actions/upload';

export default function CommandCenter() {
  const { toast } = useToast();
  const db = useDatabase();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem('coopnest_role'));
  }, []);

  const settingsRef = useMemoData(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: settingsData, loading: settingsLoading } = useDoc<SystemSettings>(settingsRef);

  const [form, setForm] = useState<Partial<SystemSettings>>({
    branding: { systemName: 'CoopNest', logoUrl: '' },
    smtp: { host: '', port: 587, user: '', pass: '', fromName: '', fromEmail: '' }
  });

  const [newLoanType, setNewLoanType] = useState<Partial<LoanType>>({
    name: '',
    interestRate: 5,
    interestType: 'FLAT',
    maxDurationMonths: 12,
    minSavingsMonths: 6,
    guarantorsRequired: 2
  });

  useEffect(() => {
    if (settingsData) {
      setForm(prev => ({ ...prev, ...settingsData }));
    }
  }, [settingsData]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !settingsRef) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await uploadLogo(formData);
      if (res.success) {
        const newLogoUrl = res.url!;
        
        // Update local state
        setForm(prev => ({
          ...prev,
          branding: { 
            ...(prev.branding || { systemName: 'CoopNest' }), 
            logoUrl: newLogoUrl 
          }
        }));
        
        // Save immediately using the most current data to ensure global updates
        const currentBranding = settingsData?.branding || { systemName: 'CoopNest' };
        await setDoc(settingsRef, {
          branding: { 
            ...currentBranding, 
            logoUrl: newLogoUrl 
          },
          updatedAt: serverTimestamp()
        }, { merge: true });

        toast({ title: "Branding Updated", description: "The new logo is now active across the entire system." });
        logAudit('Logo Modified', 'System Branding');
      } else {
        toast({ variant: "destructive", title: "Upload Failed", description: res.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to communicate with server." });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = () => {
    if (!db || !settingsRef) return;
    setLoading(true);

    const payload = {
      ...form,
      updatedAt: serverTimestamp()
    };

    setDoc(settingsRef, payload, { merge: true })
      .then(() => {
        toast({ title: "Configuration Deployed", description: "Society parameters updated in real-time." });
        logAudit('System Settings Updated', 'Global Config');
      })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new DatabasePermissionError({ path: settingsRef.path, operation: 'update', requestResourceData: payload }));
      })
      .finally(() => setLoading(false));
  };

  const addLoanType = () => {
    if (!db || !settingsRef || !newLoanType.name) return;
    const typeToAdd = { ...newLoanType, id: `lt-${Date.now()}` };
    
    updateDoc(settingsRef, {
      loanTypes: arrayUnion(typeToAdd)
    }).then(() => {
      toast({ title: "Loan Type Created", description: `${typeToAdd.name} is now available for applications.` });
      setNewLoanType({ name: '', interestRate: 5, interestType: 'FLAT', maxDurationMonths: 12, minSavingsMonths: 6, guarantorsRequired: 2 });
      logAudit('New Loan Type Added', typeToAdd.name as string);
    });
  };

  const logAudit = (action: string, target: string) => {
    if (!db) return;
    const logId = `audit-${Date.now()}`;
    setDoc(doc(db, 'auditLogs', logId), {
      action,
      actor: 'President',
      actorRole: 'PRESIDENT',
      target,
      timestamp: new Date().toISOString(),
      status: 'VERIFIED'
    });
  };

  if (role !== 'PRESIDENT') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center p-8">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-12 h-12 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black font-headline text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 font-medium max-w-md">Only the Society President has authority to access the global Command Center.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Command Center</h1>
          <p className="text-muted-foreground">Enterprise governance & financial configuration engine.</p>
        </div>
        <Button onClick={handleSave} disabled={loading || settingsLoading} className="gap-2 shadow-xl shadow-emerald-200 h-12 rounded-2xl px-8 bg-emerald-600 hover:bg-emerald-700 font-black">
          {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Deploy Logic
        </Button>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-slate-100/80 p-1 flex-wrap h-auto rounded-3xl border border-slate-200">
          <TabsTrigger value="branding" className="gap-2 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-emerald-600"><Palette className="w-4 h-4" /> Branding</TabsTrigger>
          <TabsTrigger value="financials" className="gap-2 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-emerald-600"><Calculator className="w-4 h-4" /> Financials</TabsTrigger>
          <TabsTrigger value="loans" className="gap-2 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-emerald-600"><Percent className="w-4 h-4" /> Loan Engine</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-emerald-600"><Mail className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="rails" className="gap-2 rounded-2xl data-[state=active]:bg-white data-[state=active]:text-emerald-600"><Key className="w-4 h-4" /> Payment Rails</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl font-black">Society Identity</CardTitle>
              <CardDescription>Customize the name and logo of your cooperative.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label className="font-bold ml-1">System Name</Label>
                <Input 
                  value={form.branding?.systemName || ''} 
                  onChange={(e) => setForm({...form, branding: { ...form.branding!, systemName: e.target.value }})} 
                  placeholder="e.g. CoopNest Professional" 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-emerald-500" 
                />
              </div>
              
              <div className="space-y-4">
                <Label className="font-bold ml-1">System Logo</Label>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-40 h-40 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                    {form.branding?.logoUrl ? (
                      <img src={form.branding.logoUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : (
                      <ShieldCheck className="w-10 h-10 text-slate-300" />
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <RefreshCcw className="w-8 h-8 animate-spin text-emerald-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 text-center sm:text-left">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Recommended: SVG or PNG with transparent background. Your logo will be stored locally in the system directory.</p>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="logo-upload" 
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <Button asChild variant="outline" disabled={uploadingLogo} className="h-12 rounded-2xl px-6 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all font-bold">
                        <label htmlFor="logo-upload" className="cursor-pointer gap-2">
                          <Upload className="w-4 h-4" />
                          {uploadingLogo ? 'Processing Logo...' : 'Upload System Logo'}
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl font-black">Notification Engine</CardTitle>
              <CardDescription>Configure outgoing mail server for guarantor alerts.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold ml-1">SMTP Host</Label>
                <Input 
                  value={form.smtp?.host || ''} 
                  onChange={(e) => setForm({...form, smtp: { ...form.smtp!, host: e.target.value }})} 
                  placeholder="smtp.mailgun.org" 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold ml-1">SMTP Port</Label>
                <Input 
                  type="number" 
                  value={form.smtp?.port || ''} 
                  onChange={(e) => setForm({...form, smtp: { ...form.smtp!, port: Number(e.target.value) }})} 
                  placeholder="587" 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold ml-1">SMTP User</Label>
                <Input 
                  value={form.smtp?.user || ''} 
                  onChange={(e) => setForm({...form, smtp: { ...form.smtp!, user: e.target.value }})} 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold ml-1">SMTP Password</Label>
                <Input 
                  type="password" 
                  value={form.smtp?.pass || ''} 
                  onChange={(e) => setForm({...form, smtp: { ...form.smtp!, pass: e.target.value }})} 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold ml-1">Sender Name</Label>
                <Input 
                  value={form.smtp?.fromName || ''} 
                  onChange={(e) => setForm({...form, smtp: { ...form.smtp!, fromName: e.target.value }})} 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold ml-1">Sender Email</Label>
                <Input 
                  value={form.smtp?.fromEmail || ''} 
                  onChange={(e) => setForm({...form, smtp: { ...form.smtp!, fromEmail: e.target.value }})} 
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl font-black">Contribution Mandate</CardTitle>
                <CardDescription>Configure mandatory pool inflows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem]">
                  <div className="space-y-1">
                    <Label className="text-base font-black text-emerald-950">Automated Collection</Label>
                    <p className="text-xs text-emerald-700/70 font-bold">Trigger recurring charges via Paystack engine.</p>
                  </div>
                  <Switch 
                    checked={form.isAutoDebitActive} 
                    onCheckedChange={(val) => setForm({...form, isAutoDebitActive: val})} 
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold ml-1">Min Monthly Contribution (₦)</Label>
                  <Input type="number" value={form.minMonthlyContribution || ''} onChange={(e) => setForm({...form, minMonthlyContribution: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Late Penalty (%)</Label>
                    <Input type="number" value={form.defaultPenaltyRate || ''} onChange={(e) => setForm({...form, defaultPenaltyRate: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Auto-Debit Day</Label>
                    <Input type="number" min="1" max="28" value={form.autoDebitDate || ''} onChange={(e) => setForm({...form, autoDebitDate: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50">
              <CardHeader>
                <CardTitle className="text-xl font-black">Liquidity & Risk</CardTitle>
                <CardDescription>Risk parameters for the pool.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold ml-1">Pool Liquidity Target (₦)</Label>
                  <Input type="number" value={form.totalPoolLiquidity || ''} onChange={(e) => setForm({...form, totalPoolLiquidity: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold ml-1">Loan-to-Savings Multiplier (x)</Label>
                  <Input type="number" step="0.1" value={form.loanToSavingsMultiplier || ''} onChange={(e) => setForm({...form, loanToSavingsMultiplier: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase ml-1">Based on historical contribution consistency.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="loans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50 h-fit">
              <CardHeader><CardTitle className="text-xl font-black">Define Loan Product</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold ml-1">Product Name</Label>
                  <Input placeholder="e.g. Asset Financing" value={newLoanType.name} onChange={e => setNewLoanType({...newLoanType, name: e.target.value})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Rate (%)</Label>
                    <Input type="number" value={newLoanType.interestRate} onChange={e => setNewLoanType({...newLoanType, interestRate: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold ml-1">Guarantors</Label>
                    <Input type="number" value={newLoanType.guarantorsRequired} onChange={e => setNewLoanType({...newLoanType, guarantorsRequired: Number(e.target.value)})} className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
                  </div>
                </div>
                <Button onClick={addLoanType} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-2">
                  <Plus className="w-5 h-5" /> Add to Catalog
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50">
              <CardHeader><CardTitle className="text-xl font-black">Active Products</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form.loanTypes?.map((type, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-all">
                      <div>
                        <p className="font-black text-slate-900 text-lg">{type.name}</p>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{type.interestRate}% Interest {'•'} {type.guarantorsRequired} Guarantors Req.</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                  {(!form.loanTypes || form.loanTypes.length === 0) && (
                    <div className="py-20 text-center flex flex-col items-center">
                      <Calculator className="w-12 h-12 text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold">No active loan products.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rails" className="space-y-6">
          <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-xl font-black">Payment Gateway (Paystack)</CardTitle>
              <CardDescription>Keys for bank-grade recurring billing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold ml-1">Live Public Key</Label>
                <Input type="password" value={form.paystackPublicKey || ''} onChange={(e) => setForm({...form, paystackPublicKey: e.target.value})} placeholder="pk_live_..." className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold ml-1">Live Secret Key</Label>
                <Input type="password" value={form.paystackSecretKey || ''} onChange={(e) => setForm({...form, paystackSecretKey: e.target.value})} placeholder="sk_live_..." className="h-14 bg-slate-50 border-slate-100 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
