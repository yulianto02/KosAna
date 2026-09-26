// app/src/pages/Settings.tsx - Responsive Mobile Version
import { useState, useEffect } from 'react';
import { Save, Bell, CreditCard, User, Shield, Building2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { settingsAPI } from '@/services/api';
import { getCurrentUser } from '@/services/auth';

export function Settings() {
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    business_name: 'Kos Ana Management',
    business_email: 'admin@kosana.id',
    business_phone: '081234567890',
    business_address: 'Jl. Kebayoran Lama No. 45',
    timezone: 'WIB', language: 'id', currency: 'IDR',
    qris_provider: 'xendit', qris_api_key: '', qris_sandbox: false,
    late_fee_percentage: 5, grace_period: 3,
    email_payment_received: true, email_payment_pending: true,
    email_maintenance_request: true, email_ac_cleaning_reminder: true,
    whatsapp_provider: '360dialog', whatsapp_api_key: '',
    whatsapp_phone_number_id: '', whatsapp_connected: false,
    two_fa_enabled: false,
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsAPI.get();
      if (data) setSettings(prev => ({...prev,...data}));
    } catch (error) {} finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = await getCurrentUser();
      const updatedBy = user?.id || 'system';
      await settingsAPI.update(settings, updatedBy);
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) { toast.error('Gagal menyimpan pengaturan'); }
    finally { setSaving(false); }
  };

  const handleChange = (field: string, value: any) => setSettings(prev => ({...prev, [field]: value}));

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Pengaturan</h1>
          <p className="text-sm sm:text-base text-gray-500">Konfigurasi sistem dan preferensi</p>
        </div>
        <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10 shrink-0" onClick={handleSave} disabled={saving || isLoading}>
          <Save className="w-4 h-4 mr-2" />{saving? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat pengaturan...</p>
        </div>
      )}

      {!isLoading && (
        <Tabs defaultValue="general" className="w-full">
          {/* TabsList scrollable on mobile */}
          <div className="w-full overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto h-11 sm:h-10">
              <TabsTrigger value="general" className="h-9 text-xs sm:text-sm whitespace-nowrap px-3">Umum</TabsTrigger>
              <TabsTrigger value="payment" className="h-9 text-xs sm:text-sm whitespace-nowrap px-3">Pembayaran</TabsTrigger>
              <TabsTrigger value="notifications" className="h-9 text-xs sm:text-sm whitespace-nowrap px-3">Notifikasi</TabsTrigger>
              <TabsTrigger value="whatsapp" className="h-9 text-xs sm:text-sm whitespace-nowrap px-3">WhatsApp</TabsTrigger>
              <TabsTrigger value="security" className="h-9 text-xs sm:text-sm whitespace-nowrap px-3">Keamanan</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-4 sm:space-y-6 mt-4">
            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Building2 className="w-5 h-5" />Informasi Bisnis</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="business_name" className="text-sm">Nama Bisnis</Label><Input id="business_name" value={settings.business_name} onChange={(e) => handleChange('business_name', e.target.value)} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                  <div className="space-y-2"><Label htmlFor="business_email" className="text-sm">Email Bisnis</Label><Input id="business_email" type="email" value={settings.business_email} onChange={(e) => handleChange('business_email', e.target.value)} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                  <div className="space-y-2"><Label htmlFor="business_phone" className="text-sm">Telepon Bisnis</Label><Input id="business_phone" type="text" inputMode="tel" value={settings.business_phone} onChange={(e) => handleChange('business_phone', e.target.value)} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                  <div className="space-y-2"><Label htmlFor="business_address" className="text-sm">Alamat</Label><Input id="business_address" value={settings.business_address} onChange={(e) => handleChange('business_address', e.target.value)} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Pengaturan Sistem</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {[
                  { label: 'Zona Waktu', desc: 'WIB (UTC+7)', value: settings.timezone, field: 'timezone', options: [{v:'WIB',l:'WIB (UTC+7)'},{v:'WITA',l:'WITA (UTC+8)'},{v:'WIT',l:'WIT (UTC+9)'}] },
                  { label: 'Bahasa', desc: 'Bahasa Indonesia', value: settings.language, field: 'language', options: [{v:'id',l:'Bahasa Indonesia'},{v:'en',l:'English'}] },
                  { label: 'Format Mata Uang', desc: 'Rupiah (IDR)', value: settings.currency, field: 'currency', options: [{v:'IDR',l:'Rupiah (IDR)'},{v:'USD',l:'US Dollar (USD)'}] },
                ].map((row) => (
                  <div key={row.field} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3 border-b last:border-0">
                    <div className="min-w-0"><p className="font-medium text-sm sm:text-base">{row.label}</p><p className="text-xs sm:text-sm text-gray-500">{row.desc}</p></div>
                    <select className="w-full sm:w-48 h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg bg-white shrink-0" value={row.value} onChange={(e) => handleChange(row.field, e.target.value)}>
                      {row.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4 sm:space-y-6 mt-4">
            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><CreditCard className="w-5 h-5" />Pengaturan QRIS</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2"><Label className="text-sm">Provider QRIS</Label><select className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg bg-white" value={settings.qris_provider} onChange={(e) => handleChange('qris_provider', e.target.value)}><option value="xendit">Xendit</option><option value="duitku">Duitku</option></select></div>
                <div className="space-y-2"><Label htmlFor="qris_api_key" className="text-sm">API Key</Label><Input id="qris_api_key" type="password" value={settings.qris_api_key} onChange={(e) => handleChange('qris_api_key', e.target.value)} placeholder="Masukkan API Key" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="callback_url" className="text-sm">Callback URL</Label><Input id="callback_url" value="https://kosana.id/webhooks/payment" readOnly className="h-11 text-base sm:h-10 sm:text-sm bg-gray-50" /></div>
                <div className="flex items-center justify-between gap-4 pt-2"><div className="min-w-0 flex-1"><p className="font-medium text-sm sm:text-base">Mode Sandbox</p><p className="text-xs sm:text-sm text-gray-500">Gunakan mode testing untuk pembayaran</p></div><Switch checked={settings.qris_sandbox} onCheckedChange={(checked) => handleChange('qris_sandbox', checked)} className="shrink-0" /></div>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Pengaturan Denda</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2"><Label htmlFor="late_fee_percentage" className="text-sm">Persentase Denda Keterlambatan (%)</Label><Input id="late_fee_percentage" type="text" inputMode="numeric" value={settings.late_fee_percentage} onChange={(e) => handleChange('late_fee_percentage', parseInt(e.target.value) || 0)} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="grace_period" className="text-sm">Masa Tenggang (hari)</Label><Input id="grace_period" type="text" inputMode="numeric" value={settings.grace_period} onChange={(e) => handleChange('grace_period', parseInt(e.target.value) || 0)} className="h-11 text-base sm:h-10 sm:text-sm" /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 sm:space-y-6 mt-4">
            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Bell className="w-5 h-5" />Notifikasi Email</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-1">
                {[
                  { key: 'email_payment_received', label: 'Pembayaran Diterima', desc: 'Kirim email saat pembayaran masuk' },
                  { key: 'email_payment_pending', label: 'Pembayaran Tertunda', desc: 'Kirim email saat ada pembayaran tertunda' },
                  { key: 'email_maintenance_request', label: 'Request Perawatan', desc: 'Kirim email saat ada request perawatan baru' },
                  { key: 'email_ac_cleaning_reminder', label: 'Jadwal AC Cleaning', desc: 'Kirim email reminder jadwal AC' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-4 py-4 border-b last:border-0">
                    <div className="min-w-0 flex-1"><p className="font-medium text-sm sm:text-base truncate">{item.label}</p><p className="text-xs sm:text-sm text-gray-500">{item.desc}</p></div>
                    <Switch checked={(settings as any)[item.key]} onCheckedChange={(checked) => handleChange(item.key, checked)} className="shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4 sm:space-y-6 mt-4">
            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><MessageSquare className="w-5 h-5" />WhatsApp Business API</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2"><Label className="text-sm">Provider</Label><select className="w-full h-11 sm:h-10 px-3 text-base sm:text-sm border border-gray-200 rounded-lg bg-white" value={settings.whatsapp_provider} onChange={(e) => handleChange('whatsapp_provider', e.target.value)}><option value="360dialog">360dialog</option><option value="meta">Meta Cloud API</option></select></div>
                <div className="space-y-2"><Label htmlFor="whatsapp_api_key" className="text-sm">API Key</Label><Input id="whatsapp_api_key" type="password" value={settings.whatsapp_api_key} onChange={(e) => handleChange('whatsapp_api_key', e.target.value)} placeholder="Masukkan API Key" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="whatsapp_phone_number_id" className="text-sm">Phone Number ID</Label><Input id="whatsapp_phone_number_id" value={settings.whatsapp_phone_number_id} onChange={(e) => handleChange('whatsapp_phone_number_id', e.target.value)} placeholder="Masukkan Phone Number ID" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-700"><strong>Status:</strong> {settings.whatsapp_connected? 'Terhubung' : 'Belum Terhubung'}</p><p className="text-sm text-blue-600 mt-1">Nomor: +62 812-3456-7890</p></div>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Template Pesan</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2"><Label className="text-sm">Pengingat Pembayaran</Label><textarea className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg h-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" defaultValue="Halo [NAMA], ini pengingat bahwa sewa kamar [KAMAR] jatuh tempo pada [TANGGAL]. Total: [JUMLAH]. Silakan bayar melalui QRIS. Terima kasih!" /></div>
                <div className="space-y-2"><Label className="text-sm">Konfirmasi Pembayaran</Label><textarea className="w-full px-3 py-3 text-base sm:text-sm border border-gray-200 rounded-lg h-28 resize-none focus:outline-none focus:ring-2 focus:ring-[#1A3D5C]" defaultValue="Terima kasih [NAMA]! Pembayaran sewa kamar [KAMAR] sebesar [JUMLAH] telah diterima." /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 sm:space-y-6 mt-4">
            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="flex items-center gap-2 text-base sm:text-lg"><Shield className="w-5 h-5" />Keamanan Akun</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2"><Label htmlFor="current_password" className="text-sm">Password Saat Ini</Label><Input id="current_password" type="password" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="new_password" className="text-sm">Password Baru</Label><Input id="new_password" type="password" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <div className="space-y-2"><Label htmlFor="confirm_password" className="text-sm">Konfirmasi Password</Label><Input id="confirm_password" type="password" className="h-11 text-base sm:h-10 sm:text-sm" /></div>
                <Button className="bg-[#1A3D5C] hover:bg-[#0F2744] w-full sm:w-auto h-11 sm:h-10" onClick={() => toast.success('Password berhasil diubah')}>Ubah Password</Button>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Autentikasi Dua Faktor</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1"><p className="font-medium text-sm sm:text-base">Aktifkan 2FA</p><p className="text-xs sm:text-sm text-gray-500">Tambahkan lapisan keamanan ekstra</p></div>
                  <Switch checked={settings.two_fa_enabled} onCheckedChange={(checked) => handleChange('two_fa_enabled', checked)} className="shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader className="p-4 sm:p-6"><CardTitle className="text-base sm:text-lg">Sesi Login</CardTitle></CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0"><User className="w-5 h-5 text-green-600" /></div>
                    <div className="min-w-0 flex-1"><p className="font-medium text-sm sm:text-base truncate">Chrome di Windows</p><p className="text-xs sm:text-sm text-gray-500 truncate">Jakarta, Indonesia • Aktif sekarang</p></div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 shrink-0 text-xs">Aktif</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}