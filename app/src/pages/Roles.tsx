// Roles.tsx - FIXED - no /api prefix
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { rolesAPI } from '@/services/api';
import { cn } from '@/lib/utils';

type Permission = { id: string; code: string; name: string; module: string };
type RoleWithPerms = { id: string; code: string; name: string; description?: string; permissions: Permission[] };

export function Roles() {
  const [roles, setRoles] = useState<RoleWithPerms[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res: any = await rolesAPI.getAll();
      // rolesAPI returns {roles, allPermissions, modules} directly
      const data = res.roles ? res : res.data || res;
      setRoles(data.roles || []);
      setAllPermissions(data.allPermissions || []);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat roles');
      console.error(e);
    } finally { setIsLoading(false); }
  };

  const grouped = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    for (const p of allPermissions) {
      const mod = p.module || 'other';
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    if (search) {
      const q = search.toLowerCase();
      for (const mod in map) {
        map[mod] = map[mod].filter(per => per.code.toLowerCase().includes(q) || per.name.toLowerCase().includes(q));
      }
    }
    return map;
  }, [allPermissions, search]);

  const hasPerm = (role: RoleWithPerms, permCode: string) => role.permissions.some(p => p.code === permCode);
  const orderedRoles = useMemo(() => {
    const order = ['admin', 'manager', 'penjaga', 'tukang', 'finance'];
    return [...roles].sort((a, b) => {
      const ia = order.indexOf(a.code); const ib = order.indexOf(b.code);
      if (ia === -1 && ib === -1) return a.code.localeCompare(b.code);
      if (ia === -1) return 1; if (ib === -1) return -1; return ia - ib;
    });
  }, [roles]);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-xl sm:text-2xl font-bold">Matriks Peran & Izin</h1><p className="text-sm text-gray-500">Read-only — permission per role</p></div>
        <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari permission..." className="pl-10 h-11" /></div>
      </div>
      <Card className="bg-amber-50 border-amber-200"><CardContent className="p-4 flex gap-3"><Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-amber-800">Catatan</p><p className="text-xs text-amber-700">Custom role editing coming soon. Edit assignment per-user via Users → Akses Properti. Hanya admin (users.manage) yang bisa akses.</p></div></CardContent></Card>
      {isLoading && <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto" /></div>}
      {!isLoading && (
        <div className="space-y-6">
          {Object.keys(grouped).sort().map(mod => {
            const perms = grouped[mod];
            if (perms.length === 0) return null;
            return (
              <Card key={mod} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b py-3"><CardTitle className="text-base capitalize flex items-center gap-2"><Badge variant="outline" className="bg-white">{mod}</Badge> <span className="text-sm font-normal text-gray-500">{perms.length}</span></CardTitle></CardHeader>
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 border-b"><tr><th className="px-4 py-2 text-left font-medium text-gray-600 min-w-[220px]">Permission</th>{orderedRoles.map(r=><th key={r.id} className="px-3 py-2 text-center font-medium text-gray-600 min-w-[110px]"><div className="flex flex-col items-center"><span className={cn('px-2 py-0.5 rounded text-xs font-bold', r.code==='admin'?'bg-[#5D4037] text-white': r.code==='manager'?'bg-[#1A3D5C] text-white':'bg-gray-200')}>{r.code}</span></div></th>)}</tr></thead><tbody className="divide-y">{perms.map(p=><tr key={p.id} className="hover:bg-gray-50"><td className="px-4 py-2"><div className="font-mono text-xs">{p.code}</div><div className="text-xs text-gray-500">{p.name}</div></td>{orderedRoles.map(r=><td key={r.id} className="px-3 py-2 text-center">{hasPerm(r, p.code) ? <Check className="w-5 h-5 text-green-600 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>)}</tr>)}</tbody></table></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
