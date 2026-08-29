"use client"

import { collection, query, orderBy, limit, useDatabase, useCollection, useMemoData } from '@/lib/mysql-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuditLog } from '@/lib/types';

export default function AuditCenter() {
  const db = useDatabase();

  const logsQuery = useMemoData(() => {
    if (!db) return null;
    return query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
  }, [db]);

  const { data: logs, loading } = useCollection<AuditLog>(logsQuery);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Audit Intelligence</h1>
          <p className="text-muted-foreground">Immutable logs and system verification records.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Download Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">System Integrity</CardTitle>
              <CardDescription className="text-emerald-400/70">Database-verified records.</CardDescription>
            </div>
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">All financial records are secured and tracked through the application database.</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">System Activity</CardTitle>
              <CardDescription className="text-orange-400/70">Real-time event capture.</CardDescription>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-400" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">{logs?.length || 0} recent events captured in the current cycle.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-white/5 shadow-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline font-bold">Activity Trail</CardTitle>
              <CardDescription>Immutable system event log.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search trail..." className="pl-9 h-9 bg-white/5 border-white/10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading audit trail...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead>Event ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id} className="border-white/5">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{log.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-[10px] text-muted-foreground">{log.target}</p>
                    </TableCell>
                    <TableCell className="text-sm">{log.actor}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={log.status === 'VERIFIED' ? 'bg-accent/20 text-accent' : 'bg-orange-400/20 text-orange-400'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {logs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No events found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
