// app/src/pages/Login.tsx - FIXED Step 5
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Login({ onLogin }: { onLogin?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password); // AuthContext login waits for permissions
      toast.success('Login berhasil!');
      if (onLogin) onLogin();
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err.message || 'Login gagal. Periksa username dan password.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A3D5C] via-[#0F2744] to-[#1A3D5C] flex items-center justify-center p-4 sm:p-6 w-full max-w-full overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[#D4A84B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[#4A6D8C]/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#D4A84B] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Home className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Kos Ana</h1>
          <p className="text-sm text-white/70 mt-1">Sistem Manajemen Kos Modern</p>
        </div>
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 p-5 sm:p-6 pb-3">
            <CardTitle className="text-xl sm:text-2xl text-center">Masuk</CardTitle>
            <CardDescription className="text-center">Masukkan username dan password</CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="username" type="text" placeholder="admin" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required disabled={loading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="password" type={showPassword? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-11 h-11" required disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-gray-400">{showPassword? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c as boolean)} />
                  <Label htmlFor="remember" className="text-sm">Ingat saya</Label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#1A3D5C] hover:bg-[#0F2744] h-11" disabled={loading}>{loading? 'Memuat...' : 'Masuk'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}