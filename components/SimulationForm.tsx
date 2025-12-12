import React from 'react';
import { SimulationState, AssetData } from '../types';
import { Calculator, DollarSign, Layers, ShoppingCart, TrendingUp } from 'lucide-react';

interface Props {
  state: SimulationState;
  onChange: (field: keyof SimulationState, value: string) => void;
  asset: AssetData;
}

const SimulationForm: React.FC<Props> = ({ state, onChange, asset }) => {
  const currencySymbol = asset.type === 'Criptomoeda' || asset.type === 'Ação EUA' ? 'USD' : 'R$';

  // Helper para classes de input
  const inputBaseClasses = "block w-full pl-10 pr-12 py-3 rounded-xl border transition-all outline-none font-medium";
  
  // Update classes for Dark Mode
  const defaultInputClasses = "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600";
  const activeInputClasses = "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white placeholder:text-emerald-800/30 dark:placeholder:text-emerald-500/30";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 h-full flex flex-col transition-colors">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-full text-brand-600 dark:text-brand-400">
          <Calculator size={20} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Simulação de Aporte</h2>
      </div>

      {/* 2x2 Grid Layout - flex-1 ensures it distributes space if height stretches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 flex-1">
        
        {/* 1. Quantidade Atual (Top Left) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
            Qtd. em Carteira
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors">
              <Layers size={18} />
            </div>
            <input
              type="number"
              value={state.currentQty}
              onChange={(e) => onChange('currentQty', e.target.value)}
              placeholder="0"
              className={`${inputBaseClasses} ${defaultInputClasses}`}
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">UND</span>
            </div>
          </div>
        </div>

        {/* 2. Quantidade de Compra (Top Right) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider ml-1 flex items-center gap-1">
            <ShoppingCart size={12} /> Nova Compra
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500 dark:text-emerald-400/70 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors">
              <Layers size={18} />
            </div>
            <input
              type="number"
              value={state.newQty}
              onChange={(e) => onChange('newQty', e.target.value)}
              placeholder="0"
              className={`${inputBaseClasses} ${activeInputClasses}`}
            />
             <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 bg-emerald-100/50 dark:bg-emerald-900/40 px-2 py-1 rounded">UND</span>
            </div>
          </div>
        </div>

        {/* 3. Preço Médio Atual (Bottom Left) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">
            Seu Preço Médio
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 dark:group-focus-within:text-brand-400 transition-colors">
              <DollarSign size={18} />
            </div>
            <input
              type="number"
              step="0.01"
              value={state.currentAvgPrice}
              onChange={(e) => onChange('currentAvgPrice', e.target.value)}
              placeholder="0.00"
              className={`${inputBaseClasses} ${defaultInputClasses}`}
            />
             <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-600">{currencySymbol}</span>
            </div>
          </div>
        </div>

        {/* 4. Preço de Mercado (Bottom Right - Read Only) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
            Preço de Mercado
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              <TrendingUp size={18} />
            </div>
            <div className={`block w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold cursor-not-allowed select-none flex items-center h-[50px]`}>
               {asset.currentPrice.toFixed(2)}
            </div>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-600">{currencySymbol}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SimulationForm;