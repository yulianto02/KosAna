// app/src/pages/Users.tsx - FOCUS FIX - AddUserForm moved outside
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Building2, UserX, UserCheck, KeyRound, Edit2, Trash2, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { propertiesAPI, usersAPI, rolesAPI } from '@/services/api';

type Assignment = {
  property_id: string;
  property_name: string;
  property_code?: string;
  role_id: string;
  role_code: string;
  role_name: string;
  is_owner: boolean;
};
type User = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_code: string;
  role_name: string;
  role_id: string;
  assignments: Assignment[];
};
type Role = { id: string; code: string; name: string };
type Property = { id: string; name: string; code: string };

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-[#5D4037] text-white',
  manager: 'bg-[#1A3D5C] text-white',
  penjaga: 'bg-[#7A9E7E] text-white',
  tukang: 'bg-[#D4A373] text-white',
  finance: 'bg-[#7A9EB8] text-white',
};

// --- FIX: stable form outside Users, never recreated on keystroke ---
function AddUserForm({ formData, setFormData, roles }: { formData: any; setFormData: React.Dispatch<React.SetStateAction<any>>; roles: Role[] }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2"><Label>Username *</Label><Input value={formData.username} onChange={e=>setFormData((p:any)=>({...p, username:e.target.value}))} placeholder="penjaga_kebayoran" className="h-11" required /></div>
      <div className="space-y-2"><Label>Full Name</Label><Input value={formData.full_name} onChange={e=>setFormData((p:any)=>({...p, full_name:e.target.value}))} className="h-11" /></div>
      <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={e=>setFormData((p:any)=>({...p, email:e.target.value}))} className="h-11" /></div>
      <div className="space-y-2"><Label>Temp Password *</Label><Input type="password" value={formData.password} onChange={e=>setFormData((p:any)=>({...p, password:e.target.value}))} className="h-11" required /></div>
      <div className="space-y-2"><Label>Global Role *</Label>
        <Select value={formData.role_code} onValueChange={v=>setFormData((p:any)=>({...p, role_code:v}))}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{roles.map(r=><SelectItem key={r.code} value={r.code}>{r.name} ({r.code})</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function Users() {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({ username: '', email: '', full_name: '', password: '', role_code: 'penjaga' });
  const [editData, setEditData] = useState({ email: '', full_name: '', role_code: '' });
  const [newPassword, setNewPassword] = useState('');
  const [assignRows, setAssignRows] = useState<{ propertyId: string; roleId: string; isOwner: boolean }[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes, propsRes] = await Promise.all([
        usersAPI.getAll(),
        rolesAPI.getAll(),
        propertiesAPI.getAll(),
      ]);
      const usersData = Array.isArray(usersRes)? usersRes : (usersRes as any).data || usersRes;
      setUsers(usersData as any);
      const rolesData = (rolesRes as any).roles || (rolesRes as any).data?.roles || (rolesRes as any);
      setRoles(Array.isArray(rolesData)? rolesData : rolesData.roles || []);
      const propsData = Array.isArray(propsRes)? propsRes : (propsRes as any).data || propsRes;
      setProperties(propsData as any);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat users');
      console.error('Users fetch error', e);
    } finally { setIsLoading(false); }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filterRole!== 'all' && u.role_code!== filterRole) return false;
      if (filterStatus === 'active' &&!u.is_active) return false;
      if (filterStatus === 'inactive' && u.is_active) return false;
      const q = search.toLowerCase();
      return!q || u.username.toLowerCase().includes(q) || (u.full_name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
    });
  }, [users, search, filterRole, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username ||!formData.password ||!formData.role_code) { toast.error('Username, password, role wajib'); return; }
    try {
      await usersAPI.create({ username: formData.username.trim(), email: formData.email.trim() || null, full_name: formData.full_name.trim() || formData.username, password: formData.password, role_code: formData.role_code });
      toast.success('User dibuat');
      setIsAddOpen(false);
      setFormData({ username: '', email: '', full_name: '', password: '', role_code: 'penjaga' });
      fetchAll();
    } catch (e: any) { toast.error(e?.message || 'Gagal buat user'); }
  };

  const openEdit = (u: User) => { setSelectedUser(u); setEditData({ email: u.email || '', full_name: u.full_name || '', role_code: u.role_code }); setIsEditOpen(true); };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try { await usersAPI.update(selectedUser.id, { email: editData.email, full_name: editData.full_name, role_code: editData.role_code }); toast.success('User diperbarui'); setIsEditOpen(false); fetchAll(); }
    catch (e: any) { toast.error(e?.message || 'Gagal update'); }
  };

  const toggleStatus = async (u: User) => {
    const cur = JSON.parse(localStorage.getItem('user') || localStorage.getItem('kosana_user') || '{}');
    if (u.id === cur?.id) { toast.error('Tidak bisa nonaktifkan diri sendiri'); return; }
    try { await usersAPI.setStatus(u.id,!u.is_active); toast.success(u.is_active? 'User dinonaktifkan' : 'User diaktifkan'); fetchAll(); }
    catch (e: any) { toast.error(e?.message || 'Gagal ubah status'); }
  };

  const openReset = (u: User) => { setSelectedUser(u); setNewPassword(''); setIsResetOpen(true); };
  const handleReset = async () => {
    if (!selectedUser || newPassword.length < 6) { toast.error('Min 6 karakter'); return; }
    try { await usersAPI.resetPassword(selectedUser.id, newPassword); toast.success('Password direset, sesi revoked'); setIsResetOpen(false); }
    catch (e: any) { toast.error(e?.message || 'Gagal reset'); }
  };

  const openAssign = (u: User) => {
    setSelectedUser(u);
    const rows = (u.assignments || []).map(a => ({ propertyId: a.property_id, roleId: a.role_id, isOwner:!!a.is_owner }));
    setAssignRows(rows.length? rows : [{ propertyId: '', roleId: '', isOwner: false }]);
    setIsAssignOpen(true);
  };
  const handleSaveAssignments = async () => {
    if (!selectedUser) return;
    const valid = assignRows.filter(r => r.propertyId && r.roleId);
    try { await usersAPI.setAssignments(selectedUser.id, valid); toast.success('Akses diperbarui'); setIsAssignOpen(false); fetchAll(); }
    catch (e: any) { toast.error(e?.message || 'Gagal simpan'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 w-full max-w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><h1 className="text-xl sm:text-2xl font-bold truncate">Manajemen Pengguna</h1><p className="text-sm text-gray-500">Kelola akun, role, dan akses properti</p></div>
        <Button onClick={()=>setIsAddOpen(true)} className="bg-[#1A3D5C] hover:bg-[#0F2744] h-11 w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Tambah User</Button>
      </div>

      <Card className="overflow-hidden"><CardContent className="p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari username / nama / email..." className="pl-10 h-11" /></div>
        <Select value={filterRole} onValueChange={setFilterRole}><SelectTrigger className="w-full sm:w-44 h-11"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Role</SelectItem>{roles.map(r=><SelectItem key={r.code} value={r.code}>{r.code}</SelectItem>)}</SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full sm:w-36 h-11"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Semua</SelectItem><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Nonaktif</SelectItem></SelectContent></Select>
      </CardContent></Card>

      {isLoading && <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto" /></div>}

      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Username</th><th className="px-4 py-3 text-left">Role Global</th><th className="px-4 py-3 text-left">Akses Properti</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
          <tbody className="divide-y">
            {filtered.map(u=>(
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="font-medium">{u.username}</div><div className="text-xs text-gray-500">{u.full_name} • {u.email || '-'}</div></td>
                <td className="px-4 py-3"><Badge className={cn('border-0', ROLE_COLOR[u.role_code] || 'bg-gray-200 text-gray-700')}>{u.role_code}</Badge></td>
                <td className="px-4 py-3 max-w-"><div className="flex flex-wrap gap-1">{u.assignments.length===0 && <span className="text-xs text-gray-400">global {u.role_code}</span>}{u.assignments.map(a=><Badge key={a.property_id} variant="outline" className="text-xs"><Building2 className="w-3 h-3 mr-1" />{a.property_name} • {a.role_code}{a.is_owner?' • owner':''}</Badge>)}</div></td>
                <td className="px-4 py-3"><Badge variant={u.is_active?'default':'secondary'} className={cn(u.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600')}>{u.is_active?'Aktif':'Nonaktif'}</Badge></td>
                <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={()=>openEdit(u)}><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={()=>openAssign(u)}><Settings2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={()=>openReset(u)}><KeyRound className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={()=>toggleStatus(u)} className={u.is_active?'text-amber-600':'text-green-600'}>{u.is_active?<UserX className="w-4 h-4"/>:<UserCheck className="w-4 h-4"/>}</Button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>

      <div className="md:hidden space-y-3">
        {filtered.map(u=>(
          <Card key={u.id}><CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between"><div><p className="font-semibold">{u.username}</p><p className="text-xs text-gray-500">{u.full_name}</p></div><Badge className={cn('border-0', ROLE_COLOR[u.role_code] || 'bg-gray-200')}>{u.role_code}</Badge></div>
            <div className="flex flex-wrap gap-1">{u.assignments.map(a=><Badge key={a.property_id} variant="outline" className="text-xs">{a.property_name} • {a.role_code}</Badge>)}{u.assignments.length===0 && <span className="text-xs text-gray-400">global {u.role_code}</span>}</div>
            <div className="flex gap-2 pt-2"><Button variant="outline" size="sm" className="flex-1 h-11" onClick={()=>openEdit(u)}><Edit2 className="w-4 h-4 mr-1" />Edit</Button><Button variant="outline" size="sm" className="flex-1 h-11" onClick={()=>openAssign(u)}><Building2 className="w-4 h-4 mr-1" />Akses</Button><Button variant="outline" size="sm" className="h-11" onClick={()=>toggleStatus(u)}>{u.is_active?<UserX className="w-4 h-4"/>:<UserCheck className="w-4 h-4"/>}</Button></div>
          </CardContent></Card>
        ))}
        {filtered.length===0 &&!isLoading && <div className="text-center py-10 text-gray-500">Tidak ada user</div>}
      </div>

      {isMobile? (
        <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}><SheetContent side="bottom" className="h- p-0 flex flex-col bg-white"><SheetHeader className="p-4 border-b text-left"><SheetTitle>Tambah User</SheetTitle><SheetDescription>Buat akun baru</SheetDescription></SheetHeader>
          <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden"><div className="flex-1 overflow-y-auto p-4"><AddUserForm formData={formData} setFormData={setFormData} roles={roles} /></div><SheetFooter className="p-4 border-t flex-row gap-3"><Button type="button" variant="outline" className="flex-1 h-11" onClick={()=>setIsAddOpen(false)}>Batal</Button><Button type="submit" className="flex-1 bg-[#1A3D5C] h-11">Simpan</Button></SheetFooter></form>
        </SheetContent></Sheet>
      ) : (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}><DialogContent className="max-w-lg max-h- overflow-y-auto"><DialogHeader><DialogTitle>Tambah User</DialogTitle><DialogDescription>Akun baru</DialogDescription></DialogHeader><form onSubmit={handleCreate} className="space-y-4"><AddUserForm formData={formData} setFormData={setFormData} roles={roles} /><DialogFooter><Button type="button" variant="outline" onClick={()=>setIsAddOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C]">Simpan</Button></DialogFooter></form></DialogContent></Dialog>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit {selectedUser?.username}</DialogTitle></DialogHeader>
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2"><Label>Full Name</Label><Input value={editData.full_name} onChange={e=>setEditData({...editData, full_name:e.target.value})} className="h-11" /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={editData.email} onChange={e=>setEditData({...editData, email:e.target.value})} className="h-11" /></div>
          <div className="space-y-2"><Label>Global Role</Label><Select value={editData.role_code} onValueChange={v=>setEditData({...editData, role_code:v})}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{roles.map(r=><SelectItem key={r.code} value={r.code}>{r.name} ({r.code})</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter><Button type="button" variant="outline" onClick={()=>setIsEditOpen(false)}>Batal</Button><Button type="submit" className="bg-[#1A3D5C]">Simpan</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}><DialogContent className="max-w-2xl max-h- overflow-y-auto"><DialogHeader><DialogTitle>Akses Properti - {selectedUser?.username}</DialogTitle><DialogDescription>Set per-properti role. Kosong = hapus semua.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          {assignRows.map((row, idx)=>(
            <div key={idx} className="flex flex-col sm:flex-row gap-2 p-3 border rounded-lg">
              <Select value={row.propertyId} onValueChange={v=>{ const n=[...assignRows]; n[idx].propertyId=v; setAssignRows(n); }}><SelectTrigger className="flex-1 h-11"><SelectValue placeholder="Properti" /></SelectTrigger><SelectContent>{properties.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
              <Select value={row.roleId} onValueChange={v=>{ const n=[...assignRows]; n[idx].roleId=v; setAssignRows(n); }}><SelectTrigger className="flex-1 h-11"><SelectValue placeholder="Role di properti" /></SelectTrigger><SelectContent>{roles.map(r=><SelectItem key={r.id} value={r.id}>{r.code} - {r.name}</SelectItem>)}</SelectContent></Select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row.isOwner} onChange={e=>{ const n=[...assignRows]; n[idx].isOwner=e.target.checked; setAssignRows(n); }} />Owner</label>
              <Button variant="ghost" size="sm" onClick={()=>setAssignRows(assignRows.filter((_,i)=>i!==idx))}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          <Button variant="outline" onClick={()=>setAssignRows([...assignRows, { propertyId:'', roleId:'', isOwner:false }])} className="w-full h-11"><Plus className="w-4 h-4 mr-2" />Tambah Properti</Button>
        </div>
        <DialogFooter><Button variant="outline" onClick={()=>setIsAssignOpen(false)}>Batal</Button><Button onClick={handleSaveAssignments} className="bg-[#1A3D5C]">Simpan</Button></DialogFooter>
      </DialogContent></Dialog>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Reset Password {selectedUser?.username}</DialogTitle><DialogDescription>Akan revoke semua sesi</DialogDescription></DialogHeader>
        <div className="space-y-3"><Label>New Password min 6</Label><Input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="h-11" /></div>
        <DialogFooter><Button variant="outline" onClick={()=>setIsResetOpen(false)}>Batal</Button><Button onClick={handleReset} className="bg-amber-600 hover:bg-amber-700">Reset & Revoke</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}