
import React from 'react';
import { Trade, TradeSide } from '../types';
import { ExternalLink, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface RecentTradesProps {
  trades: Trade[];
}

export const RecentTrades: React.FC<RecentTradesProps> = ({ trades }) => {
  return (
    <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl overflow-hidden shadow-sm dark:shadow-lg">
      <div className="p-5 border-b border-slate-200 dark:border-dark-900 flex justify-between items-center bg-white dark:bg-dark-800">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Execution Log</h3>
        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-50 dark:bg-dark-900">Live Chain Data</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-dark-900 uppercase text-[10px] font-bold text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-dark-900">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Market</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Size (USDC)</th>
              <th className="px-6 py-4">Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-900 bg-white dark:bg-dark-800">
            {trades.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic">
                   Listening to Polygon Network for whale activity...
                 </td>
               </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-400 dark:text-slate-500 text-xs">
                    {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight ${
                        trade.side === TradeSide.BUY
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                      }`}
                    >
                      {trade.side === TradeSide.BUY ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                      {trade.side} {trade.outcome}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={trade.marketQuestion}>
                    {trade.marketQuestion}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                    {trade.price.toFixed(3)}¢
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-900 dark:text-white font-bold">
                    ${trade.sizeUSDC.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`https://polygonscan.com/tx/${trade.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs"
                    >
                      {trade.txHash.substring(0, 6)} <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
