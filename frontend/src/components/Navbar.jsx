import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useFavourites } from '../context/FavouritesContext';
import { Sun, Moon, Heart, Search, BookOpen, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { favourites } = useFavourites();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Favourites', path: '/favourites', icon: Heart, badge: favourites.length },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-day-card/80 dark:bg-night-card/80 border-b border-day-border dark:border-night-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <BookOpen className="w-8 h-8 text-day-accent dark:text-night-accent transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-xl font-bold tracking-tight text-day-text dark:text-night-text transition-colors duration-300">
              Spark<span className="text-day-accent dark:text-night-accent">dex</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-day-accent dark:text-night-accent'
                    : 'text-day-muted hover:text-day-text dark:text-night-muted dark:hover:text-night-text'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.name}
                {link.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 px-1.5 py-0.5 text-2xs font-extrabold rounded-full bg-day-accent dark:bg-night-accent text-white flex items-center justify-center min-w-4 min-h-4 shadow-sm animate-pulse">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-day-border dark:border-night-border text-day-muted hover:text-day-text dark:text-night-muted dark:hover:text-night-text transition-all duration-200 focus:outline-none hover:scale-105"
              title={theme === 'light' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            {/* Theme Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-day-border dark:border-night-border text-day-muted dark:text-night-muted transition-all duration-200 focus:outline-none"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-day-muted dark:text-night-muted hover:text-day-text dark:hover:text-night-text focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-4 space-y-1 bg-day-card dark:bg-night-card border-b border-day-border dark:border-night-border transition-all duration-300">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActive(link.path)
                  ? 'bg-day-accent/10 text-day-accent dark:bg-night-accent/10 dark:text-night-accent'
                  : 'text-day-muted hover:bg-day-bg hover:text-day-text dark:text-night-muted dark:hover:bg-night-bg dark:hover:text-night-text'
              }`}
            >
              <div className="flex items-center gap-2">
                {link.icon && <link.icon className="w-5 h-5" />}
                <span>{link.name}</span>
              </div>
              {link.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-day-accent dark:bg-night-accent text-white">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
