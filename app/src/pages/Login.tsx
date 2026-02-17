import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { login, getUserFromToken,syncUserFromToken,removeToken } from '@/services/auth';  // ← Tambahkan import ini
import { toast } from 'sonner';            // ← Tambahkan import ini (untuk feedback)

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username: email.trim(), password });

      // Sync user dari token yang baru diset
      syncUserFromToken();

      const user = getUserFromToken();
      if (!user?.id) {
        throw new Error('Gagal mengambil data user dari token');
      }

      toast.success('Login berhasil! Selamat datang kembali.');
      onLogin();
    } catch (err: any) {
      const message = err.message || 'Login gagal. Periksa username dan password Anda.';
      setError(message);
      toast.error(message);
      // Cleanup jika gagal
      removeToken();
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setLoading(true);

  //   try {
  //     // Lakukan login → ini akan set token otomatis via setToken di auth.ts
  //     await login({ username: email.trim(), password });

  //     // Setelah token diset, fetch data user dari /auth/me
  //     // Ini lebih reliable karena /auth/me pasti mengembalikan user jika token valid
  //     const user = await getCurrentUser();

  //     if (!user) {
  //       throw new Error('Gagal mengambil data user setelah login');
  //     }

  //     // Simpan user ke localStorage agar getCurrentUserId() bisa langsung pakai
  //     localStorage.setItem('user', JSON.stringify(user));

  //     toast.success('Login berhasil! Selamat datang kembali.');
  //     onLogin();  // Arahkan ke dashboard
  //   } catch (err: any) {
  //     const message = err.message || 'Login gagal. Periksa username dan password Anda.';
  //     setError(message);
  //     toast.error(message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A3D5C] via-[#0F2744] to-[#1A3D5C] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#D4A84B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[#4A6D8C]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#D4A84B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Kos Ana</h1>
          <p className="text-white/70 mt-1">Sistem Manajemen Kos Modern</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Masuk</CardTitle>
            <CardDescription className="text-center">
              Masukkan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>  {/* ← Ubah dari "Email" jadi "Username" */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Contoh: admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={loading}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Ingat saya
                  </Label>
                </div>
                <a href="#" className="text-sm text-[#1A3D5C] hover:underline">
                  Lupa password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1A3D5C] hover:bg-[#0F2744]"
                disabled={loading}
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Belum punya akun?{' '}
                <a href="#" className="text-[#1A3D5C] hover:underline font-medium">
                  Daftar gratis
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-white/50 text-sm">
          <p>© 2026 Kos Ana. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}