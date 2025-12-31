
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Activity, Menu, X, Wallet, FileCode, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileCode, label: 'Engine Code', path: '/code' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900">
          <div className="flex items-center">
            <Activity className="text-emerald-500 mr-2" />
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">PolyMirror</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={18} className="mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-dark-800">
           <div className="flex items-center gap-3 bg-slate-50 dark:bg-dark-950 p-3 rounded-lg border border-slate-200 dark:border-dark-800">
              <div className="bg-blue-500/10 dark:bg-blue-500/20 p-2 rounded-full">
                <Wallet size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Executor Wallet</p>
                <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">0x71...9A</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center">
             <Activity className="text-emerald-500 mr-2" />
             <span className="font-bold text-slate-900 dark:text-white">PolyMirror</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-500 dark:text-slate-400">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
