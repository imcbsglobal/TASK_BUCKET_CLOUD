import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdPerson, MdLock } from 'react-icons/md';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative w-full max-w-md px-6">
        <div className="rounded-xl border border-purple-neon/30 bg-card/80 p-8 neon-glow backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-neon to-purple-neon neon-glow">
              <span className="text-background font-bold text-2xl">IMC</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter gradient-text neon-text">Welcome Back</h1>
            <p className="mt-2 text-sm text-text-secondary">Sign in to IMC Cloud Bucket.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error/20 border border-error/50">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="email">
                Username or Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MdPerson className="text-text-secondary text-xl" />
                </span>
                <input
                  className="form-input block w-full rounded-lg border border-purple-neon/30 bg-background p-3 pl-10 text-base placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/50 text-text-primary transition-all"
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
                <label className="mb-2 block text-sm font-medium text-text-primary" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MdLock className="text-text-secondary text-xl" />
                </span>
                <input
                  className="form-input block w-full rounded-lg border border-purple-neon/30 bg-background p-3 pl-10 text-base placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/50 text-text-primary transition-all"
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
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg gradient-bg px-6 py-3 text-sm font-bold text-white neon-glow hover:shadow-neon-pink transition-all focus:outline-none focus:ring-4 focus:ring-primary/50"
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
