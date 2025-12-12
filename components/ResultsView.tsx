import React from 'react';
import { CalculationResult, AssetData } from '../types';
import { ArrowDown, ArrowUp, TrendingUp, Wallet, PieChart, PlusCircle, Coins } from 'lucide-react';

interface Props {
  result: CalculationResult | null;
  asset: AssetData;
}

// ----------------------------------------------------------------------
// Component 1: Top Right Summary Card (Dark)
// ----------------------------------------------------------------------
export const ResultSummary: React.FC<Props> = ({ result, asset }) => {
  if (!result) {
      // Placeholder state to maintain layout height/balance before data is ready
      return (
        <div className="bg-slate-900 rounded-2xl p-8 h-full shadow-sm flex flex-col justify-center items-center text-center opacity-50 ring-1 ring-slate-800">
            <div className="text-slate-600 font-medium animate-pulse">
                Preencha os dados da simulação para ver o resultado.
            </div>
        </div>
      );
  }

  const oldPM = result.totalQty - (result.totalInvestedNew / asset.currentPrice) > 0 
    ? result.totalInvestedOld / (result.totalQty - (result.totalInvestedNew / asset.currentPrice))
    : 0;
  
  const diff = result.newAvgPrice - oldPM;
  const isImprovement = diff < 0; 
  const currency = asset.type === 'Criptomoeda' || asset.type === 'Ação EUA' ? 'USD' : 'R$';
  const formatMoney = (val: number) => `${currency} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden h-full flex flex-col justify-center ring-1 ring-slate-900/5 animate-in slide-in-from-right-4 duration-500">
        {/* Abstract Background Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Novo Preço Médio</h3>
             <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${isImprovement ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              {isImprovement ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
              {Math.abs(result.percentDiff).toFixed(2)}%
            </div>
          </div>
          
          <div className="text-5xl font-bold tracking-tight text-white">
            {formatMoney(result.newAvgPrice)}
          </div>
          
          <p className="text-slate-400 text-sm font-medium border-t border-slate-800 pt-4">
            {isImprovement 
              ? "Excelente! Você conseguiu baixar seu preço médio." 
              : "Atenção: Seu preço médio subiu com este aporte."}
          </p>
        </div>
      </div>
  );
};

// ----------------------------------------------------------------------
// Component 2: Bottom Grid Details (4 Cards)
// ----------------------------------------------------------------------
export const ResultGrid: React.FC<Props> = ({ result, asset }) => {
  if (!result) return null;

  const currency = asset.type === 'Criptomoeda' || asset.type === 'Ação EUA' ? 'USD' : 'R$';
  const formatMoney = (val: number) => `${currency} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-150 fade-in">
        
        {/* Card A: Valor do Aporte (Green Highlight) */}
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-600">
             <PlusCircle size={48} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-3">
             <div>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
                   <PlusCircle size={14} /> Valor do Aporte
                </span>
                <div className="text-2xl font-bold text-slate-800">
                   {formatMoney(result.totalInvestedNew)}
                </div>
             </div>
             <div className="text-xs text-emerald-700/70 font-medium bg-emerald-100/50 px-2 py-1 rounded w-fit">
                Dinheiro saindo do bolso hoje
             </div>
          </div>
        </div>

        {/* Card B: Valor de Mercado (Profit/Loss) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-slate-500">
             <PieChart size={48} />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-3">
            <div>
               <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                  <PieChart size={14} /> Valor de Mercado
               </span>
               <div className="text-2xl font-bold text-slate-800">
                  {formatMoney(result.currentMarketValue)}
               </div>
            </div>
            
            <div className={`text-xs font-bold flex items-center gap-1 ${result.potentialProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {result.potentialProfit >= 0 ? 'Lucro Potencial:' : 'Prejuízo Potencial:'} 
                <span>{result.potentialProfit >= 0 ? '+' : ''}{formatMoney(result.potentialProfit)}</span>
            </div>
          </div>
        </div>

        {/* Card C: Total Investido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-slate-500">
             <Wallet size={48} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-3">
            <div>
               <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                  <Wallet size={14} /> Total Investido
               </span>
               <div className="text-2xl font-bold text-slate-800">
                  {formatMoney(result.totalInvestedTotal)}
               </div>
            </div>
             <div className="text-xs text-slate-400 font-medium">
                Soma de todos os aportes realizados
             </div>
          </div>
        </div>

        {/* Card D: Nova Quantidade */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity text-slate-500">
             <Coins size={48} />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-3">
            <div>
               <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                  <TrendingUp size={14} /> Nova Quantidade
               </span>
               <div className="text-2xl font-bold text-slate-800">
                  {result.totalQty} <span className="text-lg font-medium text-slate-400">und.</span>
               </div>
            </div>
            <div className="text-xs text-slate-400 font-medium">
               Saldo final de ações/cotas
            </div>
          </div>
        </div>

      </div>
  );
};
