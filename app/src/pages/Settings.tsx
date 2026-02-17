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
    timezone: 'WIB',
    language: 'id',
    currency: 'IDR',
    qris_provider: 'xendit',
    qris_api_key: '',
    qris_sandbox: false,
    late_fee_percentage: 5,
    grace_period: 3,
    email_payment_received: true,
    email_payment_pending: true,
    email_maintenance_request: true,
    email_ac_cleaning_reminder: true,
    whatsapp_provider: '360dialog',
    whatsapp_api_key: '',
    whatsapp_phone_number_id: '',
    whatsapp_connected: false,
    two_fa_enabled: false,
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await settingsAPI.get();
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      // Use default settings if API fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // getCurrentUser is async, so we need to await it
      const user = await getCurrentUser();
      const updatedBy = user?.id || 'system';
      
      await settingsAPI.update(settings, updatedBy);
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-500">Konfigurasi sistem dan preferensi</p>
        </div>
        <Button 
          className="bg-[#1A3D5C] hover:bg-[#0F2744]"
          onClick={handleSave}
          disabled={saving || isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#1A3D5C] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Memuat pengaturan...</p>
        </div>
      )}

      {!isLoading && (
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="general">Umum</TabsTrigger>
            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
            <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="security">Keamanan</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Informasi Bisnis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nama Bisnis</Label>
                    <Input 
                      id="business_name" 
                      value={settings.business_name}
                      onChange={(e) => handleChange('business_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_email">Email Bisnis</Label>
                    <Input 
                      id="business_email" 
                      type="email" 
                      value={settings.business_email}
                      onChange={(e) => handleChange('business_email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_phone">Telepon Bisnis</Label>
                    <Input 
                      id="business_phone" 
                      value={settings.business_phone}
                      onChange={(e) => handleChange('business_phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_address">Alamat</Label>
                    <Input 
                      id="business_address" 
                      value={settings.business_address}
                      onChange={(e) => handleChange('business_address', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Sistem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Zona Waktu</p>
                    <p className="text-sm text-gray-500">WIB (UTC+7)</p>
                  </div>
                  <select 
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                  >
                    <option value="WIB">WIB (UTC+7)</option>
                    <option value="WITA">WITA (UTC+8)</option>
                    <option value="WIT">WIT (UTC+9)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Bahasa</p>
                    <p className="text-sm text-gray-500">Bahasa Indonesia</p>
                  </div>
                  <select 
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Format Mata Uang</p>
                    <p className="text-sm text-gray-500">Rupiah (IDR)</p>
                  </div>
                  <select 
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                    value={settings.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                  >
                    <option value="IDR">Rupiah (IDR)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pengaturan QRIS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provider QRIS</Label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    value={settings.qris_provider}
                    onChange={(e) => handleChange('qris_provider', e.target.value)}
                  >
                    <option value="xendit">Xendit</option>
                    <option value="duitku">Duitku</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qris_api_key">API Key</Label>
                  <Input 
                    id="qris_api_key" 
                    type="password" 
                    value={settings.qris_api_key}
                    onChange={(e) => handleChange('qris_api_key', e.target.value)}
                    placeholder="Masukkan API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callback_url">Callback URL</Label>
                  <Input 
                    id="callback_url" 
                    value="https://kosana.id/webhooks/payment" 
                    readOnly 
                  />
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="font-medium">Mode Sandbox</p>
                    <p className="text-sm text-gray-500">Gunakan mode testing untuk pembayaran</p>
                  </div>
                  <Switch 
                    checked={settings.qris_sandbox}
                    onCheckedChange={(checked) => handleChange('qris_sandbox', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Denda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="late_fee_percentage">Persentase Denda Keterlambatan (%)</Label>
                  <Input 
                    id="late_fee_percentage" 
                    type="number" 
                    value={settings.late_fee_percentage}
                    onChange={(e) => handleChange('late_fee_percentage', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grace_period">Masa Tenggang (hari)</Label>
                  <Input 
                    id="grace_period" 
                    type="number" 
                    value={settings.grace_period}
                    onChange={(e) => handleChange('grace_period', parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifikasi Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pembayaran Diterima</p>
                    <p className="text-sm text-gray-500">Kirim email saat pembayaran masuk</p>
                  </div>
                  <Switch 
                    checked={settings.email_payment_received}
                    onCheckedChange={(checked) => handleChange('email_payment_received', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pembayaran Tertunda</p>
                    <p className="text-sm text-gray-500">Kirim email saat ada pembayaran tertunda</p>
                  </div>
                  <Switch 
                    checked={settings.email_payment_pending}
                    onCheckedChange={(checked) => handleChange('email_payment_pending', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Request Perawatan</p>
                    <p className="text-sm text-gray-500">Kirim email saat ada request perawatan baru</p>
                  </div>
                  <Switch 
                    checked={settings.email_maintenance_request}
                    onCheckedChange={(checked) => handleChange('email_maintenance_request', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Jadwal AC Cleaning</p>
                    <p className="text-sm text-gray-500">Kirim email reminder jadwal AC</p>
                  </div>
                  <Switch 
                    checked={settings.email_ac_cleaning_reminder}
                    onCheckedChange={(checked) => handleChange('email_ac_cleaning_reminder', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Settings */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  WhatsApp Business API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    value={settings.whatsapp_provider}
                    onChange={(e) => handleChange('whatsapp_provider', e.target.value)}
                  >
                    <option value="360dialog">360dialog</option>
                    <option value="meta">Meta Cloud API</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_api_key">API Key</Label>
                  <Input 
                    id="whatsapp_api_key" 
                    type="password" 
                    value={settings.whatsapp_api_key}
                    onChange={(e) => handleChange('whatsapp_api_key', e.target.value)}
                    placeholder="Masukkan API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_phone_number_id">Phone Number ID</Label>
                  <Input 
                    id="whatsapp_phone_number_id" 
                    value={settings.whatsapp_phone_number_id}
                    onChange={(e) => handleChange('whatsapp_phone_number_id', e.target.value)}
                    placeholder="Masukkan Phone Number ID"
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Status:</strong> {settings.whatsapp_connected ? 'Terhubung' : 'Belum Terhubung'}
                  </p>
                  <p className="text-sm text-blue-600">
                    Nomor: +62 812-3456-7890
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Pesan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pengingat Pembayaran</Label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24 resize-none"
                    defaultValue="Halo [NAMA], ini pengingat bahwa sewa kamar [KAMAR] jatuh tempo pada [TANGGAL]. Total: [JUMLAH]. Silakan bayar melalui QRIS. Terima kasih!"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Pembayaran</Label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg h-24 resize-none"
                    defaultValue="Terima kasih [NAMA]! Pembayaran sewa kamar [KAMAR] sebesar [JUMLAH] telah diterima."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Keamanan Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Password Saat Ini</Label>
                  <Input id="current_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">Password Baru</Label>
                  <Input id="new_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Konfirmasi Password</Label>
                  <Input id="confirm_password" type="password" />
                </div>
                <Button 
                  className="bg-[#1A3D5C] hover:bg-[#0F2744]"
                  onClick={() => toast.success('Password berhasil diubah')}
                >
                  Ubah Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autentikasi Dua Faktor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Aktifkan 2FA</p>
                    <p className="text-sm text-gray-500">Tambahkan lapisan keamanan ekstra</p>
                  </div>
                  <Switch 
                    checked={settings.two_fa_enabled}
                    onCheckedChange={(checked) => handleChange('two_fa_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sesi Login</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Chrome di Windows</p>
                        <p className="text-sm text-gray-500">Jakarta, Indonesia • Aktif sekarang</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}