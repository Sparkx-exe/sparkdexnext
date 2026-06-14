import React, { useState } from 'react';
import { useSettingsStore } from '../store/settings';
import { Sparkles, Languages, Monitor, HelpCircle, Flame } from 'lucide-react';

export const Settings = () => {
  const {
    titleLanguage,
    setTitleLanguage,
    theme,
    setTheme,
    readingSpeed,
    setReadingSpeed,
    imageQuality,
    setImageQuality
  } = useSettingsStore();

  const [notificationToggle, setNotificationToggle] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleNotificationClick = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <div className="settings-page-container animate-fade-in">
      <div className="section-heading-wrapper">
        <h3 className="section-title">Settings</h3>
      </div>

      <div className="settings-grid">
        {/* Title Languages */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Languages size={20} color="var(--accent-primary)" />
            <h4>Manga Title Language</h4>
          </div>
          <p className="settings-card-desc">
            Choose the language script preferred when rendering manga titles across the site.
          </p>
          <div className="segmented-control">
            <button 
              className={titleLanguage === 'romaji' ? 'active' : ''} 
              onClick={() => setTitleLanguage('romaji')}
            >
              Romanized
            </button>
            <button 
              className={titleLanguage === 'english' ? 'active' : ''} 
              onClick={() => setTitleLanguage('english')}
            >
              English
            </button>
            <button 
              className={titleLanguage === 'original' ? 'active' : ''} 
              onClick={() => setTitleLanguage('original')}
            >
              Original
            </button>
          </div>
        </div>

        {/* Color Themes */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Monitor size={20} color="var(--accent-primary)" />
            <h4>Display Interface Theme</h4>
          </div>
          <p className="settings-card-desc">
            Toggle between different dark modes for specialized comfort reading.
          </p>
          <div className="segmented-control">
            <button 
              className={theme === 'dark' ? 'active' : ''} 
              onClick={() => setTheme('dark')}
            >
              Deep Dark
            </button>
            <button 
              className={theme === 'amoled' ? 'active' : ''} 
              onClick={() => setTheme('amoled')}
            >
              AMOLED Black
            </button>
            <button 
              className={theme === 'dim' ? 'active' : ''} 
              onClick={() => setTheme('dim')}
            >
              Dim Blue
            </button>
          </div>
        </div>

        {/* Quality Preference */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Flame size={20} color="var(--accent-primary)" />
            <h4>Chapter Image Quality</h4>
          </div>
          <p className="settings-card-desc">
            Reduce image files size to save mobile internet data bandwidth usage.
          </p>
          <div className="segmented-control">
            <button 
              className={imageQuality === 'data-saver' ? 'active' : ''} 
              onClick={() => setImageQuality('data-saver')}
            >
              Data Saver
            </button>
            <button 
              className={imageQuality === 'standard' ? 'active' : ''} 
              onClick={() => setImageQuality('standard')}
            >
              Standard
            </button>
            <button 
              className={imageQuality === 'high' ? 'active' : ''} 
              onClick={() => setImageQuality('high')}
            >
              High Res
            </button>
          </div>
        </div>

        {/* Reading speeds / Direction */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <Sparkles size={20} color="var(--accent-primary)" />
            <h4>Auto Scroll Speed</h4>
          </div>
          <p className="settings-card-desc">
            Speed configuration parameters utilized when auto scrolling chapters in webtoon mode.
          </p>
          <div className="segmented-control">
            <button 
              className={readingSpeed === 'off' ? 'active' : ''} 
              onClick={() => setReadingSpeed('off')}
            >
              Disabled
            </button>
            <button 
              className={readingSpeed === 'slow' ? 'active' : ''} 
              onClick={() => setReadingSpeed('slow')}
            >
              Slow
            </button>
            <button 
              className={readingSpeed === 'medium' ? 'active' : ''} 
              onClick={() => setReadingSpeed('medium')}
            >
              Medium
            </button>
            <button 
              className={readingSpeed === 'fast' ? 'active' : ''} 
              onClick={() => setReadingSpeed('fast')}
            >
              Fast
            </button>
          </div>
        </div>

        {/* Stubs Notifications */}
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <HelpCircle size={20} color="var(--accent-primary)" />
            <h4>Notifications (Stubs)</h4>
          </div>
          <p className="settings-card-desc">
            Receive reminders in the background when favorited manga release new chapters.
          </p>
          
          <div className="settings-notification-stub-row" onClick={handleNotificationClick}>
            <label className="custom-switch">
              <input 
                type="checkbox" 
                checked={notificationToggle}
                onChange={(e) => setNotificationToggle(e.target.checked)}
                disabled
              />
              <span className="switch-slider" />
            </label>
            <span className="stub-label-text">Enable Background Alerts</span>
            
            {showTooltip && (
              <span className="stub-coming-soon-tooltip">Coming soon!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
