import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Heart, Clock, Settings as SettingsIcon, ChevronLeft, LayoutGrid } from 'lucide-react';
import ThemeProvider from './components/ThemeProvider';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import FilterDrawer from './components/FilterDrawer';
import Home from './pages/Home';
import SearchModal from './components/SearchModal';
import Favourites from './pages/Favourites';
import History from './pages/History';
import Settings from './pages/Settings';
import MangaDetailPage from './components/MangaDetailPage';
import ChapterReader from './components/ChapterReader';
import NotFound from './pages/NotFound';
import CategoriesPage from './pages/CategoriesPage';
import GenrePage from './pages/GenrePage';
import { useSettingsStore } from './store/settings';

// Global handler to sync browser tab titles on route transition
function TitleHandler() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') {
      document.title = 'SparkDex — Read Manga Online';
    } else if (location.pathname === '/search') {
      document.title = 'Search Manga — SparkDex';
    } else if (location.pathname === '/favourites') {
      document.title = 'Favourites — SparkDex';
    } else if (location.pathname === '/history') {
      document.title = 'Reading History — SparkDex';
    } else if (location.pathname === '/settings') {
      document.title = 'Settings — SparkDex';
    } else if (location.pathname === '/categories') {
      document.title = 'Categories — SparkDex';
    } else if (location.pathname.startsWith('/categories/')) {
      document.title = 'Browse Genre — SparkDex';
    }
  }, [location]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSidePanelOpen = useSettingsStore((state) => state.isSidePanelOpen);
  
  // Detect if we are in chapter reader mode (manga/:mangaId/chapter/:chapterId)
  const isReaderRoute = /^\/manga\/[^/]+\/chapter\/[^/]+/.test(location.pathname);
  // Show back button on any page except home and reader
  const isHomePage = location.pathname === '/';
  const showBackButton = !isHomePage && !isReaderRoute;

  return (
    <div className="app-layout">
      {/* Title sync handler */}
      <TitleHandler />

      {/* Global Filter Drawer overlay */}
      <FilterDrawer />

      {/* Render chrome only if not in reading mode */}
      {!isReaderRoute && (
        <>
          <TopBar />
          <SidePanel />
        </>
      )}

      {/* Floating back button — shown on inner pages */}
      {showBackButton && (
        <button
          className="back-btn-floating"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
          Back
        </button>
      )}

      {/* Main content viewport */}
      <main className={isReaderRoute ? '' : `content-container ${!isSidePanelOpen ? 'panel-collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchModal />} />
          <Route path="/manga/:id" element={<MangaDetailPage />} />
          <Route path="/manga/:mangaId/chapter/:chapterId" element={<ChapterReader />} />
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:genreId" element={<GenrePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isReaderRoute && (
        <nav className="mobile-bottom-nav glass-panel">
          <NavLink to="/" end className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <HomeIcon size={20} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <LayoutGrid size={20} />
            <span>Categories</span>
          </NavLink>
          <NavLink to="/favourites" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Heart size={20} />
            <span>Favourites</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <Clock size={20} />
            <span>History</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `mobile-nav-btn ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  );
}

export default App;
