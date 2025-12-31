
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'INFO': return 'text-blue-600 dark:text-blue-400';
      case 'WARN': return 'text-yellow-600 dark:text-yellow-400';
      case 'ERROR': return 'text-red-600 dark:text-red-500';
      case 'SUCCESS': return 'text-emerald-600 dark:text-emerald-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-black rounded-xl border border-slate-200 dark:border-dark-900 shadow-sm dark:shadow-lg flex flex-col h-[300px] font-mono text-xs overflow-hidden">
      <div className="bg-white dark:bg-dark-900 px-4 py-2 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="flex gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50"></div>
           </div>
           <span className="text-slate-500 ml-2 font-bold tracking-tighter">live_listener.py</span>
         </div>
         <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Polling RPC</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {logs.length === 0 && <div className="text-slate-400 italic">No output received.</div>}
        {logs.map((log) => (
          <div key={log.id} className="break-all border-l border-slate-200 dark:border-dark-800 pl-2 ml-1">
            <span className="text-slate-400 dark:text-slate-600 mr-2 text-[10px]">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
            </span>
            <span className={`font-bold mr-2 ${getLevelColor(log.level)}`}>
              {log.level}:
            </span>
            <span className="text-slate-700 dark:text-slate-300">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
