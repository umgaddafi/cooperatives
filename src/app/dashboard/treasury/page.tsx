
"use client"

import { useState, useMemo } from 'react';
import { collection, query, orderBy, useDatabase, useCollection, useMemoData } from '@/lib/mysql-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Contribution, Loan } from '@/lib/types';

export default function TreasuryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const db = useDatabase();

  const contributionsQuery = useMemoData(() => {
    if (!db) return null;
    return query(collection(db, 'contributions'), orderBy('date', 'desc'));
  }, [db]);

  const loansQuery = useMemoData(() => {
    if (!db) return null;
    return query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: contributions, loading: loadingCont } = useCollection<Contribution>(contributionsQuery);
  const { data: loans, loading: loadingLoans } = useCollection<Loan>(loansQuery);

  const combinedLedger = useMemo(() => {
    const list: any[] = [];
    contributions?.forEach(c => list.push({
      id: c.id,
      member: c.userId, 
      amount: c.amount,
      type: 'CONTRIBUTION',
      date: new Date(c.date).toISOString().split('T')[0],
      status: c.status
    }));
    loans?.filter(l => l.status === 'DISBURSED' || l.status === 'PAID').forEach(l => list.push({
      id: l.id,
      member: l.memberName,
      amount: l.amount,
      type: 'LOAN_DISBURSEMENT',
      date: new Date(l.createdAt).toISOString().split('T')[0],
      status: 'COMPLETED'
    }));
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [contributions, loans]);

  const filteredData = useMemo(() => {
    return combinedLedger.filter(tx => {
      const matchesSearch = tx.member.toLowerCase().includes(searchTerm.toLowerCase()) || tx.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || tx.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, filterType, combinedLedger]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Treasury_Ledger");
    XLSX.writeFile(wb, `CoopNest_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalInflow = contributions?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalOutflow = loans?.filter(l => l.status === 'DISBURSED').reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Treasury Intelligence</h1>
          <p className="text-muted-foreground font-medium">Automated double-entry ledger & disbursement control.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToExcel} className="gap-2 flex-1 sm:flex-none glass-card bg-white">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Excel
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none shadow-lg shadow-emerald-200">
            <CreditCard className="w-4 h-4" /> Run Payouts
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Contributions" value={`₦${totalInflow.toLocaleString()}`} icon={ArrowUpRight} trend="+₦1.2M this month" />
        <StatCard title="Total Disbursements" value={`₦${totalOutflow.toLocaleString()}`} icon={ArrowDownLeft} variant="destructive" />
        <StatCard title="Net Pool Position" value={`₦${(totalInflow - totalOutflow).toLocaleString()}`} icon={CheckCircle2} />
      </div>

      <Card className="rounded-[2.5rem] border-white/5 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black">Master Ledger</CardTitle>
              <CardDescription>Verifiable history of all financial flows.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search ledger..." 
                  className="pl-10 h-10 bg-slate-50 border-slate-100 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-10 border-slate-100">
                <Filter className="w-4 h-4 mr-2" /> Sort
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(loadingCont || loadingLoans) ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">Reconciling master ledger...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100">
                  <TableHead className="font-bold">Transaction ID</TableHead>
                  <TableHead className="font-bold">Entity/Member</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Execution Date</TableHead>
                  <TableHead className="font-bold text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((tx) => (
                  <TableRow key={tx.id} className="border-slate-100 hover:bg-emerald-50/30 transition-colors group">
                    <TableCell className="font-mono text-xs text-muted-foreground group-hover:text-emerald-600 transition-colors">
                      {tx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-bold text-slate-800">{tx.member}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black tracking-widest bg-slate-100 border-slate-200 uppercase">
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("font-black", tx.amount > 100000 ? "text-emerald-600" : "text-slate-900")}>
                      ₦{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">{tx.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {tx.status === 'PENDING' && <AlertTriangle className="w-3 h-3 text-orange-400" />}
                        <Badge className={cn(
                          "font-bold",
                          tx.status === 'SUCCESS' || tx.status === 'COMPLETED' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : 'bg-orange-100 text-orange-700 border-orange-200'
                        )}>
                          {tx.status}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No ledger entries matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, trend, variant }: { title: string, value: string, icon: any, trend?: string, variant?: 'default' | 'destructive' }) {
  const bgClass = variant === 'destructive' ? 'bg-slate-800' : (title.includes('Net') ? 'bg-orange-500' : 'bg-emerald-600');
  
  return (
    <Card className={cn("rounded-[2.5rem] overflow-hidden relative group text-white border-none shadow-2xl", bgClass)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">{title}</CardTitle>
        <div className="p-3 bg-white/20 rounded-2xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="pb-8">
        <div className="text-3xl font-black font-headline tracking-tighter">{value}</div>
        {trend && (
          <p className="text-[10px] font-black mt-2 bg-white/20 inline-block px-3 py-1 rounded-full">
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
