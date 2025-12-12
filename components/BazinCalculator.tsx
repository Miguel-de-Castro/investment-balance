import React, { useState, useEffect } from 'react';
import { AssetData } from '../types';
import { ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Percent, Info } from 'lucide-react';

interface Props {
  asset: AssetData;
}

const BazinCalculator: React.FC<Props> = ({ asset }) => {
  const [targetYield, setTargetYield] = useState<number>(6); // Default 6% standard
  
  // Input Mode: 'value' (R$ 1.00) or 'percent' (10%)
  const [inputMode, setInputMode] = useState<'value' | 'percent'>('value');
  
  const [customDividend, setCustomDividend] = useState<string>(''); // User override for R$
  const [customYieldInput, setCustomYieldInput] = useState<string>(''); // User override for %

  // 1. Determine the Dividend Value (Numerator)
  let actualAnnualDividend = 0;
  let usedYieldPercent = 0;

  if (inputMode === 'value') {
    // Mode R$: Use custom value or implied from asset data
    const impliedDividend = asset.dividendYield 
      ? (asset.currentPrice * (asset.dividendYield / 100))
      : 0;
    actualAnnualDividend = customDividend ? parseFloat(customDividend) : impliedDividend;
    // Calculate equivalent yield for display purposes
    usedYieldPercent = asset.currentPrice > 0 ? (actualAnnualDividend / asset.currentPrice) * 100 : 0;
  } else {
    // Mode %: Use custom % or asset DY
    usedYieldPercent = customYieldInput ? parseFloat(customYieldInput) : (asset.dividendYield || 0);
    actualAnnualDividend = asset.currentPrice * (usedYieldPercent / 100);
  }

  // 2. Calculate Ceiling Price (Bazin)
  // Formula: Dividend / (TargetYield / 100)
  const ceilingPrice = targetYield > 0 ? actualAnnualDividend / (targetYield / 100) : 0;
  
  const isSafe = asset.currentPrice <= ceilingPrice;
  const safetyMargin = ceilingPrice > 0 
    ? ((ceilingPrice - asset.currentPrice) / ceilingPrice) * 100 
    : 0;

  useEffect(() => {
     // Reset inputs if asset changes
     setCustomDividend('');
     setCustomYieldInput('');
  }, [asset.ticker]);

  // If crypto or asset without yield logic
  if (asset.type === 'Criptomoeda') {
      return (
          <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 border-dashed">
              <AlertTriangle className="mx-auto mb-2 text-slate-400 dark:text-slate-500" size={32} />
              <h3 className="font-semibold text-lg">Método Inaplicável</h3>
              <p className="text-sm mt-1">Criptomoedas não pagam dividendos constantes, portanto o Método Bazin de preço teto não se aplica.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      
      {/* Explanation & Formula Box */}
      <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-xl text-blue-900 dark:text-blue-200 shadow-sm">
        <div className="flex items-start gap-3">
            <Info className="shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" size={20} />
            <div className="space-y-2 w-full">
                <p className="text-sm font-medium">
                    O <strong>Método Bazin</strong> define o preço teto dividindo o dividendo anual pelo retorno mínimo esperado ({targetYield}%).
                </p>
                
                {/* Visual Formula */}
                <div className="mt-3 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg border border-blue-100/50 dark:border-blue-900/30 flex flex-col items-center justify-center text-sm font-mono text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2 mb-1">
                        <span>Preço Teto</span>
                        <span>=</span>
                        <div className="flex flex-col items-center">
                            <span className="border-b border-slate-400 dark:border-slate-500 w-full text-center px-1">Dividendos (12m)</span>
                            <span>Taxa Esperada ({targetYield/100})</span>
                        </div>
                    </div>
                    
                    {/* Live Calc */}
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1 bg-blue-100/50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        R$ {ceilingPrice.toFixed(2)} = R$ {actualAnnualDividend.toFixed(2)} ÷ {targetYield/100}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
                 <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                     <TrendingUp size={18} /> Parâmetros
                 </h3>
                 
                 {/* Target Yield Input */}
                 <div>
                     <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Retorno Mínimo Esperado (Bazin)</label>
                     <div className="relative">
                        <input 
                            type="number" 
                            step="0.5"
                            value={targetYield}
                            onChange={(e) => setTargetYield(parseFloat(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-8 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none font-semibold transition-colors"
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 text-sm">%</span>
                     </div>
                 </div>

                 <hr className="border-slate-100 dark:border-slate-800" />

                 {/* Dynamic Input (Value OR Yield) */}
                 <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                            Base de Cálculo
                        </label>
                        {/* Toggle Switch */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                            <button 
                                onClick={() => setInputMode('value')}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${inputMode === 'value' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <DollarSign size={12} /> R$
                            </button>
                            <button 
                                onClick={() => setInputMode('percent')}
                                className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${inputMode === 'percent' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            >
                                <Percent size={12} /> %
                            </button>
                        </div>
                     </div>

                     {inputMode === 'value' ? (
                         <div className="relative animate-in fade-in zoom-in-95 duration-200">
                            <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-sm">R$</span>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder={asset.dividendYield ? (asset.currentPrice * (asset.dividendYield/100)).toFixed(2) : "0.00"}
                                value={customDividend}
                                onChange={(e) => setCustomDividend(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pl-8 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                Total pago nos últimos 12 meses (por ação).
                            </p>
                         </div>
                     ) : (
                        <div className="relative animate-in fade-in zoom-in-95 duration-200">
                            <input 
                                type="number" 
                                step="0.1"
                                placeholder={asset.dividendYield ? asset.dividendYield.toString() : "0.0"}
                                value={customYieldInput}
                                onChange={(e) => setCustomYieldInput(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 pr-8 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 text-sm">%</span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                Dividend Yield atual do ativo.
                            </p>
                        </div>
                     )}
                 </div>
             </div>
          </div>

          {/* Result Card */}
          <div className={`rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden transition-colors duration-500 ${isSafe ? 'bg-emerald-600 dark:bg-emerald-700' : 'bg-rose-600 dark:bg-rose-700'}`}>
              {/* Background Decoration */}
              <div className="absolute -right-4 -top-4 bg-white opacity-10 rounded-full w-32 h-32 blur-2xl"></div>
              
              <div>
                  <h3 className="text-white/80 font-medium text-sm uppercase tracking-wider mb-1">Preço Teto (Bazin)</h3>
                  <div className="text-4xl font-bold tracking-tight flex items-baseline gap-2">
                      R$ {ceilingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex justify-between items-end">
                      <div>
                          <div className="text-xs text-white/70 uppercase font-bold mb-1">Cotação Atual</div>
                          <div className="text-xl font-semibold">R$ {asset.currentPrice.toFixed(2)}</div>
                      </div>
                      <div className="text-right">
                          <div className="flex items-center justify-end gap-1 font-bold text-white mb-1">
                              {isSafe ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                              {isSafe ? 'Compra Segura' : 'Preço Caro'}
                          </div>
                          <div className="text-xs text-white/80">
                              Margem: {safetyMargin > 0 ? '+' : ''}{safetyMargin.toFixed(2)}%
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default BazinCalculator;