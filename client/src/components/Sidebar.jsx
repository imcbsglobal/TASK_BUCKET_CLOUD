import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 flex-shrink-0 bg-[#fbfcfc] dark:bg-[#111418] border-r border-slate-200 dark:border-slate-800 p-4 h-screen fixed left-0 top-0 overflow-y-hidden">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBUl-On-iWKZRycimaLnZEaEcIjc-TlJIF2ZjoDAtJKdvHoyXKUK_ocgDy5FJbPCgPq-0Mae-hcNNSM3WhE1r5vkF8LeQQRv2olk8gVdeG3AXlZNLSOLoU46Gq00JrqvRsiEnvm-X3yw_4RJ2efErSnxO2I-bw5KplU39DH-CiY-szhnmz6o05xGEoxAGtsHoWzSyzUKmHkFCYWO0PozxcT-ky6gdGMuGkfpwJugUp0KzUqH_KJpN7b2kYWJla6e3fHRC-59nEwxfkt")' }}
            />
            <div className="flex flex-col">
              <h1 className="text-slate-900 dark:text-white text-base font-medium leading-normal">Cloudflare R2</h1>
              <p className="text-slate-500 dark:text-[#9dabb9] text-sm font-normal leading-normal">Image Management</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 mt-4">
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive('/dashboard') 
                  ? 'bg-gradient-to-r from-[var(--gradient-start)]/10 to-[var(--gradient-end)]/10'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive('/dashboard') ? 'gradient-text' : ''}`} style={isActive('/dashboard') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                history
              </span>
              <p className={`text-sm font-medium leading-normal ${isActive('/dashboard') ? 'gradient-text' : ''}`}>
                Recent Uploads
              </p>
            </Link>
            
            <Link 
              to="/gallery" 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive('/gallery')
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive('/gallery') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                photo_library
              </span>
              <p className="text-sm font-medium leading-normal">List All</p>
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-col gap-4">
          <Link to="/dashboard">
            <button className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">New Upload</span>
            </button>
          </Link>
          
          <div className="flex flex-col gap-1">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg w-full"
            >
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-medium leading-normal">Logout</p>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
