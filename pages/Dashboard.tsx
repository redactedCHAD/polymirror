
import React, { useEffect, useState } from 'react';
import { 
  fetchTrades, 
  fetchStats, 
  fetchConfig, 
  fetchLogs, 
  simulateWhaleActivity, 
  updateConfig 
} from '../services/mockBackend';
import { Trade, BotStats, LogEntry } from '../types';
import { StatCard } from '../components/StatCard';
import { RecentTrades } from '../components/RecentTrades';
import { TerminalLog } from '../components/TerminalLog';
import { 
  Play, 
  Square, 
  TrendingUp, 
  Wallet, 
  Copy, 
  Activity,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<BotStats | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Listen for dark mode changes manually for Recharts
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleBot = async () => {
    const newState = !isActive;
    await updateConfig({ isActive: newState });
    setIsActive(newState);
  };

  useEffect(() => {
    const loadInitial = async () => {
        const config = await fetchConfig();
        setIsActive(config.isActive);
    };
    loadInitial();

    const interval = setInterval(async () => {
      if (!isActive) return;
      
      setIsScanning(true);
      await simulateWhaleActivity();

      const [newTrades, newStats, newLogs] = await Promise.all([
        fetchTrades(),
        fetchStats(),
        fetchLogs()
      ]);

      setTrades(newTrades);
      setStats(newStats);
      setLogs(newLogs);

      const reversedTrades = [...newTrades].reverse();
      let cumulative = 0;
      const data = reversedTrades.map(t => {
        cumulative += t.sizeUSDC;
        return {
          name: new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          volume: cumulative,
        };
      });
      setChartData(data);
      setIsScanning(false);
    }, 5000); 

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Command Center <Zap className="text-emerald-500" size={20} />
          </h1>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
             <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
             Engine: <span className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-tight">{isActive ? 'Polygon RPC Streaming' : 'Offline'}</span>
             {isScanning && <span className="ml-2 text-[10px] text-emerald-500 animate-pulse uppercase font-black tracking-tighter">Scanning...</span>}
          </div>
        </div>
        
        <button
          onClick={toggleBot}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-md active:scale-95 ${
            isActive 
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 dark:shadow-rose-900/20'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900/20'
          }`}
        >
          {isActive ? <><Square size={18} fill="currentColor" /> STOP ENGINE</> : <><Play size={18} fill="currentColor" /> START ENGINE</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Aggregated Volume" 
          value={`$${stats?.totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}`} 
          icon={Activity} 
          trend="Blockchain verified"
          color="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard 
          title="Session PL" 
          value={`$${stats?.balance.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}`} 
          icon={Wallet} 
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          title="Events Tracked" 
          value={stats?.totalTrades || 0} 
          icon={Copy} 
          color="text-orange-600 dark:text-orange-400"
        />
        <StatCard 
          title="Protocol Success" 
          value={`${stats?.winRate || 0}%`} 
          icon={TrendingUp} 
          trend="Copy execution"
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl p-5 shadow-sm dark:shadow-lg min-h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Copy-Trade Growth</h3>
            <span className="text-[10px] bg-slate-50 dark:bg-dark-900 text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-dark-800 font-bold">SIMULATED P&L</span>
          </div>
          <div className="flex-1 w-full h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? "#64748b" : "#94a3b8"} 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDark ? "#64748b" : "#94a3b8"} 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderColor: isDark ? '#1e293b' : '#e2e8f0', 
                        color: isDark ? '#e2e8f0' : '#0f172a', 
                        fontSize: '12px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                  />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
           <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Chain Relay <Activity size={16} className="text-emerald-500" />
              </h3>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active</span>
              </div>
           </div>
           <TerminalLog logs={logs} />
           
           <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2">Network Health</h4>
              <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-600 dark:text-slate-400">Polygon RPC Latency</span>
                 <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-500">42ms</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-dark-900 h-1.5 rounded-full mt-2 overflow-hidden">
                 <div className="bg-emerald-500 h-full w-[95%]"></div>
              </div>
           </div>
        </div>
      </div>

      <RecentTrades trades={trades} />
    </div>
  );
};
