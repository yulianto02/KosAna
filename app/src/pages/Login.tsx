// app/src/pages/Login.tsx - Responsive Mobile Version
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { login, getUserFromToken, syncUserFromToken, removeToken } from '@/services/auth';
import { toast } from 'sonner';

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
      syncUserFromToken();
      const user = getUserFromToken();
      if (!user?.id) throw new Error('Gagal mengambil data user dari token');
      toast.success('Login berhasil! Selamat datang kembali.');
      onLogin();
    } catch (err: any) {
      const message = err.message || 'Login gagal. Periksa username dan password Anda.';
      setError(message);
      toast.error(message);
      removeToken();
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h- bg-gradient-to-br from-[#1A3D5C] via-[#0F2744] to-[#1A3D5C] flex items-center justify-center p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#D4A84B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[#4A6D8C]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6 pb-[env(safe-area-inset-bottom)]">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#D4A84B] rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            <Home className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Kos Ana</h1>
          <p className="text-sm sm:text-base text-white/70 mt-1">Sistem Manajemen Kos Modern</p>
        </div>

        <Card className="border-0 shadow-2xl w-full overflow-hidden">
          <CardHeader className="space-y-1 p-5 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl text-center">Masuk</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">Masukkan email dan password Anda</CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm break-words">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Contoh: admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-base sm:h-10 sm:text-sm w-full"
                    required
                    disabled={loading}
                    autoComplete="username"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-11 text-base sm:h-10 sm:text-sm w-full"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-11 w-11 sm:h-10 sm:w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 shrink-0"
                    disabled={loading}
                    aria-label={showPassword? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword? <EyeOff className="w-5 h-5 sm:w-4 sm:h-4" /> : <Eye className="w-5 h-5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 min-h-">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={loading}
                    className="h-5 w-5 sm:h-4 sm:w-4"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Ingat saya</Label>
                </div>
                <a href="#" className="text-sm text-[#1A3D5C] hover:underline shrink-0 min-h- flex items-center">
                  Lupa password?
                </a>
              </div>

              <Button type="submit" className="w-full bg-[#1A3D5C] hover:bg-[#0F2744] h-11 sm:h-10 text-base sm:text-sm font-medium" disabled={loading}>
                {loading? 'Memuat...' : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Belum punya akun?{' '}
                <a href="#" className="text-[#1A3D5C] hover:underline font-medium min-h- inline-flex items-center">
                  Daftar gratis
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-white/50 text-xs sm:text-sm px-4">
          <p>© 2026 Kos Ana. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}