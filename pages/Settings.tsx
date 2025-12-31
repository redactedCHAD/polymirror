
import React, { useEffect, useState } from 'react';
import { fetchConfig, updateConfig, fetchExecutorBalances } from '../services/mockBackend';
import { BotConfig, TokenBalance } from '../types';
import { 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  History, 
  ExternalLink, 
  CheckCircle2, 
  Wallet2, 
  CreditCard,
  Target
} from 'lucide-react';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchConfig().then(setConfig);
    loadBalances();
    const interval = setInterval(loadBalances, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadBalances = async () => {
    const data = await fetchExecutorBalances();
    setBalances(data);
    setIsLoadingBalances(false);
  };

  const handleChange = (field: keyof BotConfig, value: any) => {
    if (config) {
      setConfig({ ...config, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    await updateConfig(config);
    setTimeout(() => setIsSaving(false), 800);
  };

  const selectPreviousWallet = (address: string) => {
    handleChange('targetWallet', address);
  };

  if (!config) return <div className="p-10 text-center text-slate-500">Connecting to wallet system...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Engine Configuration</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time parameters for the listener and execution modules.</p>
        </div>
        <button 
           onClick={handleSave}
           disabled={isSaving}
           className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 disabled:opacity-50 active:scale-95"
         >
           {isSaving ? 'Synchronizing...' : <><Save size={18} /> Update Strategy</>}
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Core Settings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Target Whale Card */}
          <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl p-6 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-dark-900 pb-4">
               <div className="flex items-center gap-2">
                  <Target className="text-blue-600 dark:text-blue-500" size={20} />
                  <h3 className="font-bold text-slate-900 dark:text-white">Relay Target</h3>
               </div>
               <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">Real-Time Sync</span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Active Whale Wallet Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={config.targetWallet}
                    onChange={(e) => handleChange('targetWallet', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-lg px-4 py-3 text-emerald-600 dark:text-emerald-400 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-inner"
                    placeholder="0x..."
                  />
                  <div className="absolute right-3 top-3.5 flex items-center gap-2 pointer-events-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">Listening</span>
                  </div>
                </div>
              </div>

              {/* History List */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={14} className="text-slate-400" />
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Previous Targets</label>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {config.walletHistory.length > 0 ? (
                    config.walletHistory.map((wallet) => (
                      <div 
                        key={wallet} 
                        className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                          config.targetWallet.toLowerCase() === wallet.toLowerCase()
                          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 ring-1 ring-blue-100 dark:ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-dark-950 border-slate-200 dark:border-dark-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-md bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 flex items-center justify-center text-[10px] font-bold ${config.targetWallet.toLowerCase() === wallet.toLowerCase() ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {wallet.slice(2, 4).toUpperCase()}
                          </div>
                          <span className={`font-mono text-xs truncate max-w-[200px] md:max-w-none ${config.targetWallet.toLowerCase() === wallet.toLowerCase() ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            {wallet}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {config.targetWallet.toLowerCase() === wallet.toLowerCase() ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <button 
                              onClick={() => selectPreviousWallet(wallet)}
                              className="text-[10px] font-black text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest"
                            >
                              Relay
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic py-4">No wallet history detected in storage.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Card */}
          <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl p-6 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-dark-900 pb-4">
               <AlertTriangle className="text-orange-600 dark:text-orange-500" size={20} />
               <h3 className="font-bold text-slate-900 dark:text-white">Execution Logic</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mirror Proportion</label>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 rounded">{(config.copyRatio * 100).toFixed(0)}% of Whale</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.01" 
                      max="1.0" 
                      step="0.01"
                      value={config.copyRatio}
                      onChange={(e) => handleChange('copyRatio', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-100 dark:bg-dark-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Slippage Tolerance</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={config.slippageTolerance * 100}
                        onChange={(e) => handleChange('slippageTolerance', parseFloat(e.target.value) / 100)}
                        className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-lg px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold"
                      />
                      <span className="absolute right-4 top-2.5 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Max Exposure (USDC)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        value={config.maxCapUSDC}
                        onChange={(e) => handleChange('maxCapUSDC', parseFloat(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-lg pl-8 pr-4 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Endpoint (Polygon RPC)</label>
                    <input 
                      type="text" 
                      value={config.rpcUrl}
                      onChange={(e) => handleChange('rpcUrl', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-lg px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs font-mono focus:outline-none border-blue-500 transition-all"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Balances & Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Executor Balances Card */}
          <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl overflow-hidden shadow-sm dark:shadow-lg">
            <div className="bg-slate-50 dark:bg-dark-900 p-4 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet2 className="text-emerald-600 dark:text-emerald-400" size={18} />
                <h3 className="font-bold text-slate-900 dark:text-white">Executor Vault</h3>
              </div>
              <button 
                onClick={loadBalances}
                className={`p-1 hover:bg-slate-200 dark:hover:bg-dark-800 rounded-full transition-colors ${isLoadingBalances ? 'animate-spin text-emerald-500' : 'text-slate-500'}`}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="p-4 space-y-2.5">
              {isLoadingBalances ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                   <div className="w-8 h-8 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Updating Ledger...</p>
                </div>
              ) : (
                balances.map((token, idx) => (
                  <div key={`${token.symbol}-${token.network}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-900 rounded-lg hover:border-blue-300 dark:hover:border-slate-700 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 ${token.symbol === 'MATIC' || token.symbol === 'ETH' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase">{token.symbol}</span>
                          <span className="text-[8px] bg-slate-200 dark:bg-dark-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-black tracking-widest">{token.network}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{token.contractAddress ? `${token.contractAddress.slice(0, 6)}...` : 'NATIVE CHAIN'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{token.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}</p>
                      <p className="text-[10px] text-slate-500 font-bold">${token.usdValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="bg-slate-50 dark:bg-dark-900/50 p-3 flex justify-center border-t border-slate-100 dark:border-dark-800">
              <button className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center gap-1 uppercase tracking-widest">
                Blockchain Explorer <ExternalLink size={10} />
              </button>
            </div>
          </div>

          {/* Secure Key Info */}
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-3">
                <CreditCard className="text-rose-600 dark:text-rose-500" size={18} />
                <h4 className="text-[10px] font-black text-rose-800 dark:text-rose-200 uppercase tracking-widest">Encrypted Vault</h4>
             </div>
             <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
               The <span className="text-rose-700 dark:text-rose-300 font-bold">Executor Private Key</span> is managed securely on the backend. This dashboard provides a read-only view of its metadata and current balances.
             </p>
             <div className="relative">
                <input 
                  type={showKey ? "text" : "password"} 
                  value={config.privateKeyMasked ? "8f2a...d3e9...01fb...928c" : ""}
                  disabled
                  className="w-full bg-white dark:bg-dark-950 border border-rose-200 dark:border-rose-900/20 rounded-lg px-4 py-2.5 text-rose-500/50 font-mono text-xs cursor-not-allowed shadow-inner"
                />
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};
