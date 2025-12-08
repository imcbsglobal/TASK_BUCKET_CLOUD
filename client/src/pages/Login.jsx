import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const success = login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password. Try: admin / admin123');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background-light dark:bg-background-dark">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 dark:from-blue-900/30 dark:to-purple-900/30"></div>
      </div>
      
      <div className="relative w-full max-w-md px-6">
        <div className="rounded-xl border border-slate-200/50 bg-white/50 p-8 shadow-lg backdrop-blur-lg dark:border-slate-800/50 dark:bg-[#1c2127]/50">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBUl-On-iWKZRycimaLnZEaEcIjc-TlJIF2ZjoDAtJKdvHoyXKUK_ocgDy5FJbPCgPq-0Mae-hcNNSM3WhE1r5vkF8LeQQRv2olk8gVdeG3AXlZNLSOLoU46Gq00JrqvRsiEnvm-X3yw_4RJ2efErSnxO2I-bw5KplU39DH-CiY-szhnmz6o05xGEoxAGtsHoWzSyzUKmHkFCYWO0PozxcT-ky6gdGMuGkfpwJugUp0KzUqH_KJpN7b2kYWJla6e3fHRC-59nEwxfkt")' }}
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter text-slate-900 dark:text-white">Welcome Back</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to manage your image uploads.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white" htmlFor="email">
                Username or Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-slate-400">person</span>
                </span>
                <input
                  className="form-input block w-full rounded-lg border border-slate-300 bg-background-light p-3 pl-10 text-base placeholder:text-slate-400 focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-[#101922] dark:text-white dark:placeholder:text-slate-500"
                  id="email"
                  name="email"
                  placeholder="admin"
                  required
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-slate-400">lock</span>
                </span>
                <input
                  className="form-input block w-full rounded-lg border border-slate-300 bg-background-light p-3 pl-10 text-base placeholder:text-slate-400 focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-[#101922] dark:text-white dark:placeholder:text-slate-500"
                  id="password"
                  name="password"
                  placeholder="admin123"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <button
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/50"
                type="submit"
              >
                <span className="truncate">Login</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
