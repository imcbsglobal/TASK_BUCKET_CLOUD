import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdHistory, MdPhotoLibrary, MdLogout, MdUpload } from 'react-icons/md';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewUpload = () => {
    if (location.pathname === '/dashboard') {
      // Scroll to upload form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r border-purple-neon/20 p-4 h-screen fixed left-0 top-0 overflow-y-hidden">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="bg-gradient-to-br from-yellow-neon to-purple-neon rounded-full size-10 flex items-center justify-center neon-glow"
            >
              <span className="text-background font-bold text-lg">IMC</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-yellow-neon text-base font-bold leading-normal neon-text">IMC Cloud Bucket</h1>
              <p className="text-text-secondary text-sm font-normal leading-normal">Image Management</p>
            </div>
          </div>
          
          <nav className="flex flex-col gap-2 mt-4">
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive('/dashboard') 
                  ? 'bg-primary/20 text-primary neon-glow'
                  : 'text-text-secondary hover:bg-card/50 hover:text-primary'
              }`}
            >
              <MdHistory className="text-xl" />
              <p className="text-sm font-medium leading-normal">
                Upload
              </p>
            </Link>
            
            <Link 
              to="/gallery" 
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive('/gallery')
                  ? 'bg-primary/20 text-primary neon-glow'
                  : 'text-text-secondary hover:bg-card/50 hover:text-primary'
              }`}
            >
              <MdPhotoLibrary className="text-xl" />
              <p className="text-sm font-medium leading-normal">Gallery</p>
            </Link>
          </nav>
        </div>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleNewUpload}
            className="flex items-center justify-center gap-2 w-full rounded-lg h-10 px-4 gradient-bg text-white text-sm font-bold leading-normal tracking-[0.015em] neon-glow hover:shadow-neon-pink transition-all"
          >
            <MdUpload className="text-xl" />
            <span className="truncate">New Upload</span>
          </button>
          
          <div className="flex flex-col gap-1">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:bg-card/50 hover:text-error rounded-lg w-full transition-all"
            >
              <MdLogout className="text-xl" />
              <p className="text-sm font-medium leading-normal">Logout</p>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
