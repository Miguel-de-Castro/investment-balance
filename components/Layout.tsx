import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Home, History } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Invest<span className="text-brand-600">Calc+</span>
            </span>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link 
              to="/" 
              className={`p-2 rounded-md transition-colors ${isActive('/') ? 'bg-slate-100 text-brand-600' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Início"
            >
              <Home size={22} />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 mt-auto">
        <p>&copy; {new Date().getFullYear()} InvestCalc+. Dados simulados para demonstração.</p>
      </footer>
    </div>
  );
};

export default Layout;