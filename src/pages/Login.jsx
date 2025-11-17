import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ThemeToggle from '@/components/ThemeToggle';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const loggedIn = await login(email, password);
    if (loggedIn) {
      toast.success('Login Successful!');
      navigate(from, { replace: true });
    } else {
      setError('Invalid email or password. Please try again.');
      toast.error('Login Failed!');
    }
  };

  const handleForgotPin = () => {
    toast.warning('Contact Head Office for PIN reset.', {
      icon: <AlertCircle className="text-amber-500" />,
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background flex items-center justify-center p-4">
       <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhUspgoCiiYzdVTGXzZ_eGuIJ4DFg467VMmQwkaQgCwek_y_BYYegfR67o1gk2bXxPaWd6VhJoR-7npqySIzyK8IV7EY67YDAgviRmXwOA5FzauC4kmjeqe4C-y9Du6u5aOsZiPvRBv0xnoKb6Pi5KGlDs3KxoeyMT5oQYY5ffMBD9s412M4KrDevShgOw/s320/logo.png" alt="Malwa CRM Logo" className="mx-auto h-16 w-auto" />
            <h2 className="mt-4 text-2xl font-bold text-brand-dark dark:text-dark-text">Welcome to Malwa CRM</h2>
        </div>
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">User ID / Email</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red bg-transparent dark:text-dark-text dark:border-gray-600" required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">PIN / Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red bg-transparent dark:text-dark-text dark:border-gray-600" required />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div className="pt-2">
             <Button type="submit" className="w-full">
                <LogIn className="h-5 w-5 mr-2" /> Login
            </Button>
          </div>
          <div className="text-center space-y-2">
            <Button type="button" variant="ghost" onClick={handleForgotPin}>Forgot PIN?</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default Login;
