import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Clock, Settings, Sun, Moon, MoonStar, X, LayoutGrid, Download } from 'lucide-react';

const Github = ({ size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Instagram = ({ size = 20, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import { useSettingsStore } from '../store/settings';

export const SidePanel = ({ isSidePanelOpen, setSidePanelOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    theme,
    setTheme
  } = useSettingsStore();

  // Swipe to close panel on mobile/tablet viewports
  React.useEffect(() => {
    if (!isSidePanelOpen || window.innerWidth >= 1024) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Swipe right (towards screen edge) to close
      if (diffX > 60 && Math.abs(diffY) < 50) {
        setSidePanelOpen(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidePanelOpen, setSidePanelOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    // On mobile, close side panel when navigating
    if (window.innerWidth < 1024) {
      setSidePanelOpen(false);
    }
  };

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('amoled');
    } else if (theme === 'amoled') {
      setTheme('dim');
    } else {
      setTheme('dark');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'amoled':
        return <MoonStar size={18} className="theme-icon amoled-glow" />;
      case 'dim':
        return <Sun size={18} className="theme-icon dim-glow" />;
      case 'dark':
      default:
        return <Moon size={18} className="theme-icon dark-glow" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'amoled':
        return 'AMOLED Black';
      case 'dim':
        return 'Dim Mode';
      case 'dark':
      default:
        return 'Dark Mode';
    }
  };

  const activeClass = (path) => (location.pathname === path ? 'active' : '');

  return (
    <>
      {/* Mobile Scrim */}
      <div 
        className={`sidepanel-scrim ${isSidePanelOpen ? 'visible' : ''}`} 
        onClick={() => setSidePanelOpen(false)}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSidePanelOpen(false);
        }}
      />

      <aside className={`sidepanel glass-panel ${isSidePanelOpen ? 'open' : 'collapsed'}`}>
        {/* Mobile close button */}
        <button 
          className="sidepanel-close-btn" 
          onClick={() => setSidePanelOpen(false)}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSidePanelOpen(false);
          }}
          aria-label="Close Side Panel"
        >
          <X size={20} />
        </button>

        {/* 1. User Avatar Section */}
        <div className="sidepanel-header">
          <div className="avatar-placeholder">
            <span>SD</span>
          </div>
          <div className="user-info">
            <span className="user-name">SparkDex Reader</span>
            <span className="user-role">Guest Mode</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidepanel-nav">
          <button
            className={`nav-item ${location.pathname === '/categories' || location.pathname.startsWith('/categories/') ? 'active' : ''}`}
            onClick={() => handleNavigate('/categories')}
          >
            <LayoutGrid size={20} className="nav-icon" />
            <span>Categories</span>
          </button>

          <button 
            className={`nav-item ${activeClass('/favourites')}`}
            onClick={() => handleNavigate('/favourites')}
          >
            <Heart size={20} className="nav-icon text-heart" />
            <span>Favourites</span>
          </button>

          <button 
            className={`nav-item ${activeClass('/history')}`}
            onClick={() => handleNavigate('/history')}
          >
            <Clock size={20} className="nav-icon text-clock" />
            <span>Reading History</span>
          </button>

          <button 
            className={`nav-item ${activeClass('/settings')}`}
            onClick={() => handleNavigate('/settings')}
          >
            <Settings size={20} className="nav-icon text-settings" />
            <span>Settings</span>
          </button>

          <a 
            href="https://github.com/Sparkx-exe/Sparkdex/releases/download/v1.0/Sparkdex.apk"
            className="nav-item"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidePanelOpen(false);
              }
            }}
          >
            <Download size={20} className="nav-icon text-download" />
            <span>Download App</span>
          </a>

          <div className="nav-divider" />

          {/* Theme Toggle Custom Switch */}
          <div className="theme-toggle-container">
            <span className="theme-toggle-label">Theme</span>
            <button 
              className="theme-pill-switch" 
              onClick={cycleTheme}
              aria-label={`Current theme is ${getThemeLabel()}. Click to switch.`}
            >
              <div className={`theme-pill-knob theme-${theme}`}>
                {getThemeIcon()}
              </div>
              <span className="theme-pill-text">{getThemeLabel()}</span>
            </button>
          </div>
        </nav>

        {/* Footer & Social Links */}
        <div className="sidepanel-footer">
          <div className="social-links">
            <a 
              href="https://github.com/Sparkx-exe" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit Sparkx-exe on GitHub"
            >
              <Github size={20} />
            </a>
            <a 
              href="https://instagram.com/aight.nayann" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit @aight.nayann on Instagram"
            >
              <Instagram size={20} />
            </a>
          </div>
          
          <div className="app-version">
            <span>SparkDex v1.0</span>
            <span>Powered by MangaDex</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidePanel;
