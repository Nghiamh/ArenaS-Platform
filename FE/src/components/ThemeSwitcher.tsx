import React, { useEffect, useState } from 'react';

const themes = [
  { id: 'arena', name: 'Arena Original', color: '#3B82F6', secondary: '#10B981' },
  { id: 'neon', name: 'Dark Neon', color: '#CCFF00', secondary: '#00F5FF' },
  { id: 'cyber', name: 'Cyber Athlete', color: '#FF0055', secondary: '#8A2BE2' },
  { id: 'grass', name: 'Grass & Clay', color: '#FF5722', secondary: '#4CAF50' },
  { id: 'laser', name: 'Premium Laser', color: '#CCFF00', secondary: '#FFD700' },
  { id: 'speed', name: 'Speed Light Mode', color: '#F8FAFC', secondary: '#0F172A' },
];

export const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState('arena');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('arenas_theme') || 'arena';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('arenas_theme', themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full transition group"
        style={{
          border: '1px solid rgba(var(--accent-primary-rgb), 0.25)',
          backgroundColor: isOpen ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'rgba(255,255,255,0.04)',
        }}
        title="Đổi giao diện"
      >
        <svg
          className="h-4 w-4 transition-transform group-hover:rotate-45"
          style={{ color: 'var(--accent-primary)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 top-10 z-50 w-52 rounded-xl py-1.5 shadow-xl"
            style={{
              backgroundColor: 'var(--bg-deep)',
              border: '1px solid rgba(var(--accent-primary-rgb), 0.2)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(var(--accent-primary-rgb),0.08)',
            }}
          >
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(var(--accent-primary-rgb),0.6)' }}>
              Chủ đề
            </div>
            <div className="flex flex-col gap-0.5 px-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition"
                  style={{
                    color: currentTheme === theme.id ? 'white' : 'rgba(255,255,255,0.65)',
                    backgroundColor: currentTheme === theme.id ? 'rgba(var(--accent-primary-rgb),0.12)' : '',
                  }}
                  onMouseEnter={e => { if (currentTheme !== theme.id) (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'); }}
                  onMouseLeave={e => { if (currentTheme !== theme.id) (e.currentTarget.style.backgroundColor = ''); }}
                >
                  <span>{theme.name}</span>
                  <div className="flex -space-x-1">
                    <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: theme.color }} />
                    <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: theme.secondary }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
