import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AssetData, AssetType, SimulationState, CalculationResult } from '../types';
import { fetchAssetPrice } from '../services/marketService';
import { addToHistory } from '../services/storage';
import SimulationForm from '../components/SimulationForm';
import { ResultSummary, ResultGrid } from '../components/ResultsView';
import BazinCalculator from '../components/BazinCalculator';
import { ArrowLeft, Loader2, RefreshCw, Calculator, TrendingUp } from 'lucide-react';

const Simulator: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'avg' | 'bazin'>('avg');
  
  // Simulation Inputs
  const [formState, setFormState] = useState<SimulationState>({
    currentQty: '',
    currentAvgPrice: '',
    newQty: ''
  });

  // Load Asset Data
  const loadData = async () => {
    if (!ticker) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchAssetPrice(ticker);
      setAsset(data);
      addToHistory(data);
    } catch (err) {
      setError('Não foi possível carregar os dados do ativo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  // Handle Input Changes
  const handleInputChange = (field: keyof SimulationState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Real-time Calculation
  const result: CalculationResult | null = useMemo(() => {
    if (!asset) return null;
    
    const qOld = parseFloat(formState.currentQty.toString());
    const pOld = parseFloat(formState.currentAvgPrice.toString());
    const qNew = parseFloat(formState.newQty.toString());
    const pCurrent = asset.currentPrice;

    if (isNaN(qOld) || isNaN(pOld) || isNaN(qNew)) return null;

    const totalInvestedOld = qOld * pOld;
    const totalInvestedNew = qNew * pCurrent;
    const totalInvestedTotal = totalInvestedOld + totalInvestedNew;
    const totalQty = qOld + qNew;
    
    if (totalQty === 0) return null;

    const newAvgPrice = totalInvestedTotal / totalQty;
    const percentDiff = pOld !== 0 ? ((newAvgPrice - pOld) / pOld) * 100 : 0;
    
    const currentMarketValue = totalQty * pCurrent;
    const costBasis = totalInvestedTotal;
    const potentialProfit = currentMarketValue - costBasis;

    return {
      newAvgPrice,
      totalInvestedOld,
      totalInvestedNew,
      totalInvestedTotal,
      totalQty,
      percentDiff,
      currentMarketValue,
      potentialProfit
    };

  }, [formState, asset]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
        <Loader2 className="animate-spin mb-4 text-brand-500" size={32} />
        <p>Buscando cotação atual...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 mb-4">!</div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ops! Algo deu errado.</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Ativo não encontrado.'}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition">
          Voltar para Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition">
          <ArrowLeft size={20} className="mr-1" /> Voltar
        </button>
        <button onClick={loadData} className="p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-full transition" title="Atualizar Cotação">
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Asset Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
            <span className="text-lg font-bold text-slate-400 dark:text-slate-500">{asset.ticker[0]}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{asset.ticker}</h1>
            <div className="flex items-center gap-2">
               <span className="text-sm text-slate-500 dark:text-slate-400">{asset.name}</span>
               <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{asset.type}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Cotação Atual</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {asset.type === AssetType.CRYPTO || asset.type === AssetType.US_STOCK ? 'USD' : 'R$'} {asset.currentPrice.toFixed(2)}
          </p>
          {asset.dividendYield !== undefined && asset.dividendYield > 0 && (
             <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 bg-emerald-50 dark:bg-emerald-900/30 inline-block px-2 py-0.5 rounded-md">
                 DY {asset.dividendYield}%
             </p>
          )}
        </div>
      </div>

      {/* Tab Switching */}
      <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl transition-colors">
          <button 
            onClick={() => setActiveTab('avg')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'avg' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Calculator size={16} /> Preço Médio
          </button>
          <button 
            onClick={() => setActiveTab('bazin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'bazin' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <TrendingUp size={16} /> Preço Teto (Bazin)
          </button>
      </div>

      {/* Conditional Content */}
      {activeTab === 'avg' ? (
        <div className="space-y-6">
            {/* Row 1: Form + Summary Highlight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <SimulationForm 
                    state={formState} 
                    onChange={handleInputChange} 
                    asset={asset}
                />
                <ResultSummary result={result} asset={asset} />
            </div>

            {/* Row 2: Detail Grid (Full Width) */}
            <ResultGrid result={result} asset={asset} />
        </div>
      ) : (
          <BazinCalculator asset={asset} />
      )}
    </div>
  );
};

export default Simulator;