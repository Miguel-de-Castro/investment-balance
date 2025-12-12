import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, History, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { getSearchHistory } from '../services/storage';
import { searchAssets } from '../services/marketService';
import { AssetData } from '../types';

const Home: React.FC = () => {
  const [ticker, setTicker] = useState('');
  const [history, setHistory] = useState<AssetData[]>([]);
  const [suggestions, setSuggestions] = useState<AssetData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setHistory(getSearchHistory());

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTicker(value);

    if (value.trim().length > 0) {
      const results = await searchAssets(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (assetTicker: string) => {
    setTicker(assetTicker);
    setShowSuggestions(false);
    navigate(`/simulate/${assetTicker}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim().length > 1) {
      navigate(`/simulate/${ticker.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10">
      
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Calcule seu <span className="text-brand-600 dark:text-brand-400">Preço Médio</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Simule novos aportes em Ações, FIIs e Criptomoedas e descubra instantaneamente o impacto na sua carteira.
        </p>
      </div>

      <div className="relative z-20" ref={searchContainerRef}>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl shadow-brand-900/5 dark:shadow-black/20 border border-slate-200 dark:border-slate-800 transition-colors">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="pl-4 text-slate-400">
              <Search size={24} />
            </div>
            <input
              type="text"
              className="w-full p-4 text-lg outline-none text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent uppercase font-medium"
              placeholder="Ex: PETR4, BTC, AAPL..."
              value={ticker}
              onChange={handleInputChange}
              onFocus={() => ticker.length > 0 && setShowSuggestions(true)}
            />
            <button 
              type="submit"
              disabled={ticker.length < 3}
              className="bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white p-3 px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Simular <ArrowRight size={18} />
            </button>
          </form>
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((asset) => (
              <button
                key={asset.ticker}
                onClick={() => handleSelectSuggestion(asset.ticker)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 group text-left"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                     {asset.ticker.substring(0, 1)}
                   </div>
                   <div>
                     <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-brand-700 dark:group-hover:text-brand-400">{asset.ticker}</div>
                     <div className="text-xs text-slate-400 dark:text-slate-500">{asset.name}</div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{asset.type}</span>
                   <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-xs font-semibold pl-1">
            <History size={14} />
            Histórico Recente
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.map((item, idx) => (
              <button
                key={`${item.ticker}-${idx}`}
                onClick={() => navigate(`/simulate/${item.ticker}`)}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-900 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                    {item.ticker.substring(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{item.ticker}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                     {item.type === 'Criptomoeda' || item.type === 'Ação EUA' ? 'USD' : 'R$'} {item.currentPrice}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-600">Última: {item.lastUpdated}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/60 dark:border-slate-800 relative z-10">
        <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-2">
              <span className="font-bold">BR</span>
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-300 text-sm">Ações & FIIs</h3>
        </div>
         <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-2">
              <span className="font-bold">₿</span>
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-300 text-sm">Criptomoedas</h3>
        </div>
         <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-2">
              <span className="font-bold">US</span>
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-300 text-sm">Mercado EUA</h3>
        </div>
      </div>
    </div>
  );
};

export default Home;