import { useState } from 'react';
import { Save, Bell, CreditCard, User, Shield, Building2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Settings() {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1000);
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
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>

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
                  <Label htmlFor="businessName">Nama Bisnis</Label>
                  <Input id="businessName" defaultValue="Kos Ana Management" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email Bisnis</Label>
                  <Input id="businessEmail" type="email" defaultValue="admin@kosana.id" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Telepon Bisnis</Label>
                  <Input id="businessPhone" defaultValue="081234567890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Alamat</Label>
                  <Input id="businessAddress" defaultValue="Jl. Kebayoran Lama No. 45" />
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
                <select className="px-3 py-2 border border-gray-200 rounded-lg">
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
                <select className="px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Format Mata Uang</p>
                  <p className="text-sm text-gray-500">Rupiah (IDR)</p>
                </div>
                <select className="px-3 py-2 border border-gray-200 rounded-lg">
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
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="xendit">Xendit</option>
                  <option value="duitku">Duitku</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input id="apiKey" type="password" value="xxxxxxxxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="callbackUrl">Callback URL</Label>
                <Input id="callbackUrl" value="https://kosana.id/webhooks/payment" readOnly />
              </div>
              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="font-medium">Mode Sandbox</p>
                  <p className="text-sm text-gray-500">Gunakan mode testing untuk pembayaran</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Denda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lateFeePercentage">Persentase Denda Keterlambatan (%)</Label>
                <Input id="lateFeePercentage" type="number" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Masa Tenggang (hari)</Label>
                <Input id="gracePeriod" type="number" defaultValue="3" />
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pembayaran Tertunda</p>
                  <p className="text-sm text-gray-500">Kirim email saat ada pembayaran tertunda</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Request Perawatan</p>
                  <p className="text-sm text-gray-500">Kirim email saat ada request perawatan baru</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Jadwal AC Cleaning</p>
                  <p className="text-sm text-gray-500">Kirim email reminder jadwal AC</p>
                </div>
                <Switch defaultChecked />
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
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="360dialog">360dialog</option>
                  <option value="meta">Meta Cloud API</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="waApiKey">API Key</Label>
                <Input id="waApiKey" type="password" value="xxxxxxxxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input id="phoneNumberId" value="1234567890" />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Status:</strong> Terhubung
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
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button className="bg-[#1A3D5C] hover:bg-[#0F2744]">
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
                <Switch />
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
    </div>
  );
}
