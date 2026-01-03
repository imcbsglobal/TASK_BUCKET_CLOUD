import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdHistory, MdPhotoLibrary, MdLogout, MdUpload, MdClose, MdCode, MdPeople } from 'react-icons/md';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  const handleNewUpload = () => {
    if (location.pathname === '/dashboard') {
      // Scroll to upload form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
    onClose?.();
  };

  const handleNavClick = () => {
    onClose?.();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 bg-card border-r border-purple-neon/20 p-4 h-screen fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-purple-neon/10 text-text-secondary hover:text-primary transition-all"
          aria-label="Close menu"
        >
          <MdClose className="text-2xl" />
        </button>
        
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive('/gallery')
                  ? 'bg-primary/20 text-primary neon-glow'
                  : 'text-text-secondary hover:bg-card/50 hover:text-primary'
              }`}
            >
              <MdPhotoLibrary className="text-xl" />
              <p className="text-sm font-medium leading-normal">Gallery</p>
            </Link>
            
            <Link 
              to="/clients"
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive('/clients')
                  ? 'bg-primary/20 text-primary neon-glow'
                  : 'text-text-secondary hover:bg-card/50 hover:text-primary'
              }`}
            >
              <MdPeople className="text-xl" />
              <p className="text-sm font-medium leading-normal">Clients</p>
            </Link>
            
            <Link 
              to="/api-docs"
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive('/api-docs')
                  ? 'bg-primary/20 text-primary neon-glow'
                  : 'text-text-secondary hover:bg-card/50 hover:text-primary'
              }`}
            >
              <MdCode className="text-xl" />
              <p className="text-sm font-medium leading-normal">API Docs</p>
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
    </>
  );
};

export default Sidebar;
