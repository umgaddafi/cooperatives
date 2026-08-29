
"use client"

import { useState, useEffect } from 'react';
import { collection, query, orderBy, doc, updateDoc, setDoc, addDoc, useDatabase, useCollection, useMemoData, errorEmitter, DatabasePermissionError } from '@/lib/mysql-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Filter, Loader2, Edit3, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar as UIAvatar, AvatarFallback as UIAvatarFallback, AvatarImage as UIAvatarImage } from '@/components/ui/avatar';

export default function MemberDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  const [newMember, setNewMember] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'MEMBER',
    status: 'Active'
  });

  const [editForm, setEditForm] = useState<Partial<User>>({
    name: '',
    role: 'MEMBER',
    status: 'Active'
  });

  const db = useDatabase();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('coopnest_role');
      setIsAdmin(userRole === 'PRESIDENT');
    }
  }, []);

  const membersQuery = useMemoData(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db]);

  const { data: members, loading } = useCollection<User>(membersQuery);

  const handleAddMember = () => {
    if (!db || !newMember.name || !newMember.email) return;
    setIsAdding(true);

    const usersCol = collection(db, 'users');
    const memberId = `MB-${Math.floor(1000 + Math.random() * 9000)}`;
    const payload = {
      ...newMember,
      memberId,
      joinDate: new Date().toISOString().split('T')[0],
      totalSavings: 0,
      status: 'Active'
    };

    addDoc(usersCol, payload)
      .then(() => {
        toast({ title: "Member Registered", description: `${newMember.name} has been enrolled in the society.` });
        setIsAddModalOpen(false);
        setNewMember({ name: '', email: '', role: 'MEMBER', status: 'Active' });
        logAudit('Manual Enrollment', newMember.name!);
      })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new DatabasePermissionError({
          path: usersCol.path,
          operation: 'create',
          requestResourceData: payload
        }));
      })
      .finally(() => setIsAdding(false));
  };

  const handleUpdateMember = () => {
    if (!db || !selectedMember) return;
    setIsUpdating(true);

    const userRef = doc(db, 'users', selectedMember.id);
    const updateData = { ...editForm };

    updateDoc(userRef, updateData)
      .then(() => {
        toast({ title: "Registry Synchronized", description: "Member governance details updated successfully." });
        setIsEditModalOpen(false);
        logAudit('Member Data Modified', selectedMember.name);
      })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new DatabasePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      })
      .finally(() => setIsUpdating(false));
  };

  const logAudit = (action: string, target: string) => {
    if (!db) return;
    const logId = `audit-${Date.now()}`;
    setDoc(doc(db, 'auditLogs', logId), {
      action,
      actor: 'System Admin',
      actorRole: 'PRESIDENT',
      target,
      timestamp: new Date().toISOString(),
      status: 'VERIFIED'
    });
  };

  const filteredMembers = members?.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.memberId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Society Directory</h1>
          <p className="text-muted-foreground">Comprehensive registry of all active and pending society members.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-emerald-200/50 bg-emerald-600 hover:bg-emerald-700 font-bold h-12 rounded-2xl px-6 transition-all active:scale-95">
                <UserPlus className="w-5 h-5" /> Enroll New Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-slate-100 bg-white shadow-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-headline text-slate-900">New Enrollment</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">
                  Manually register an individual into the cooperative registry.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label className="font-bold ml-1 text-slate-700">Full Legal Name</Label>
                  <Input 
                    placeholder="Kenneth Salihu" 
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold ml-1 text-slate-700">Official Email</Label>
                  <Input 
                    type="email"
                    placeholder="k.salihu@society.org" 
                    className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-emerald-500"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold ml-1 text-slate-700">Society Role</Label>
                  <Select onValueChange={(val) => setNewMember({...newMember, role: val as UserRole})} defaultValue="MEMBER">
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl">
                      <SelectValue placeholder="Assign role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="TREASURER">Treasurer</SelectItem>
                      <SelectItem value="SECRETARY_GENERAL">Secretary General</SelectItem>
                      <SelectItem value="AUDITOR">Auditor</SelectItem>
                      <SelectItem value="ASSISTANT_PRESIDENT">Assistant President</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddMember} disabled={isAdding} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg">
                  {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Registration'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search by name, member ID or contact..." 
            className="pl-12 h-12 bg-white border-slate-100 rounded-2xl shadow-sm focus:ring-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 border-slate-100 h-12 rounded-2xl font-bold bg-white text-slate-600">
          <Filter className="w-5 h-5" /> Filter Results
        </Button>
      </div>

      <Card className="rounded-[2.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              <p className="text-sm font-bold text-slate-500 animate-pulse">Synchronizing society records...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="w-[300px] font-bold text-slate-900">Member</TableHead>
                  <TableHead className="font-bold text-slate-900">Society ID</TableHead>
                  <TableHead className="font-bold text-slate-900">Role</TableHead>
                  <TableHead className="font-bold text-slate-900">Joined</TableHead>
                  <TableHead className="font-bold text-slate-900">Standing</TableHead>
                  <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers?.map((member) => (
                  <TableRow key={member.id} className="border-slate-100 hover:bg-emerald-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <UIAvatar className="h-10 w-10 border border-slate-100 shadow-sm">
                          <UIAvatarImage src={`https://picsum.photos/seed/${member.id}/200/200`} />
                          <UIAvatarFallback className="bg-emerald-50 text-emerald-700 font-bold">{member.name?.substring(0, 2).toUpperCase()}</UIAvatarFallback>
                        </UIAvatar>
                        <div>
                          <p className="text-sm font-black text-slate-900">{member.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 tracking-tight">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-600">{member.memberId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black uppercase tracking-widest px-3">
                        {member.role?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">{member.joinDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                        <span className="text-xs font-bold text-slate-700">{member.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedMember(member);
                              setEditForm({ name: member.name, role: member.role, status: member.status });
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-1.5" /> Edit
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 rounded-xl font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsViewModalOpen(true);
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-slate-100 bg-white shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Modify Registry File</DialogTitle>
            <DialogDescription>Update society standing and governance permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label className="font-bold ml-1 text-slate-700">Full Name</Label>
              <Input 
                className="h-12 bg-slate-50 border-slate-100 rounded-xl"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-1 text-slate-700">Society Role</Label>
              <Select onValueChange={(val) => setEditForm({...editForm, role: val as UserRole})} value={editForm.role}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="TREASURER">Treasurer</SelectItem>
                  <SelectItem value="SECRETARY_GENERAL">Secretary General</SelectItem>
                  <SelectItem value="AUDITOR">Auditor</SelectItem>
                  <SelectItem value="ASSISTANT_PRESIDENT">Assistant President</SelectItem>
                  <SelectItem value="PRESIDENT">President</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold ml-1 text-slate-700">System Status</Label>
              <Select onValueChange={(val) => setEditForm({...editForm, status: val as any})} value={editForm.status}>
                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending Approval</SelectItem>
                  <SelectItem value="Inactive">Suspended/Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateMember} disabled={isUpdating} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg">
              {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply Registry Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden bg-white shadow-2xl">
          {selectedMember && (
            <div>
              <div className="bg-emerald-600 p-10 text-white">
                <div className="flex items-center gap-6">
                  <UIAvatar className="h-24 w-24 border-4 border-white/20 shadow-2xl">
                    <UIAvatarImage src={`https://picsum.photos/seed/${selectedMember.id}/200/200`} />
                    <UIAvatarFallback className="text-3xl font-black bg-white/20">{selectedMember.name?.substring(0, 2).toUpperCase()}</UIAvatarFallback>
                  </UIAvatar>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight">{selectedMember.name}</h2>
                    <p className="text-emerald-50 font-bold uppercase tracking-widest text-[10px]">{selectedMember.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registry ID</p>
                    <p className="text-lg font-black text-slate-900">{selectedMember.memberId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Savings Pool</p>
                    <p className="text-lg font-black text-emerald-600">₦{(selectedMember.totalSavings || 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Enrollment Date</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMember.joinDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Standing</p>
                    <Badge className={selectedMember.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}>
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-100 font-bold" onClick={() => setIsViewModalOpen(false)}>Close Registry File</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
