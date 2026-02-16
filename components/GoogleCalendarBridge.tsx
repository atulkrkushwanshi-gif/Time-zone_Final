import React from 'react';
import { Calendar, X, ExternalLink, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Member } from '../types';
import { generateGoogleCalendarUrl, getTzDisplay } from '../utils';

interface BridgeProps {
  isOpen: boolean;
  onClose: () => void;
  startTime: Date;
  endTime: Date;
  selectedMembers: Member[]; // Currently all active members
}

export const GoogleCalendarBridge: React.FC<BridgeProps> = ({
  isOpen, onClose, startTime, endTime, selectedMembers
}) => {
  if (!isOpen) return null;

  const handleCreate = () => {
    const url = generateGoogleCalendarUrl({
      startTime,
      endTime,
      title: 'Time-Sync Meeting',
      description: `Scheduled via ChronoSync.\n\nTimezone Context:\n${selectedMembers.map(m => `- ${m.name}: ${getTzDisplay(m.timezone)}`).join('\n')}`,
      guests: selectedMembers.map(m => m.email)
    });
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div className="w-full max-w-md bg-[#09090b] border-t sm:border border-zinc-800 shadow-2xl rounded-none overflow-hidden relative z-10 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-12 sm:zoom-in-95 fade-in duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        
        {/* Mobile Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing" onClick={onClose}>
           <div className="w-12 h-1 bg-zinc-800 rounded-none" />
        </div>

        <div className="p-6 pb-4 border-b border-zinc-800 relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cred-accent/5 blur-3xl rounded-full pointer-events-none" />

          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="flex flex-col gap-1">
               <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                 <Calendar className="text-cred-accent" size={20} />
                 Confirm Event
               </h2>
               <p className="text-zinc-500 text-xs">Review details before exporting.</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-zinc-500 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 p-2 rounded-none transition-all duration-300 hover:rotate-90 active:scale-90"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Time Card */}
          <div className="flex items-stretch rounded-none overflow-hidden border border-zinc-800 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100 fill-mode-backwards">
            <div className="bg-zinc-900/50 w-24 flex flex-col items-center justify-center p-3 border-r border-zinc-800">
               <span className="text-xs font-bold text-cred-accent uppercase">{format(startTime, 'MMM')}</span>
               <span className="text-2xl font-bold text-white">{format(startTime, 'dd')}</span>
            </div>
            <div className="flex-1 bg-black/20 p-3 flex flex-col justify-center gap-1">
               <div className="flex items-center gap-2 text-zinc-400 text-xs">
                 <Clock size={12} />
                 <span className="font-mono">{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
               </div>
               <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                 Your Local Time
               </div>
            </div>
          </div>

          {/* Participants List */}
          <div className="space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200 fill-mode-backwards">
             <div className="flex items-center justify-between text-xs text-zinc-500 uppercase font-bold tracking-wider px-1">
               <span className="flex items-center gap-1.5"><Users size={12} /> Participants</span>
               <span className="bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded-none text-[10px]">{selectedMembers.length}</span>
             </div>
             <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1 bg-zinc-900/20 rounded-none p-2 border border-zinc-800/50">
               {selectedMembers.map((m, i) => (
                 <div 
                   key={m.id} 
                   className="flex items-center justify-between p-2 rounded-none hover:bg-zinc-800/40 transition-colors group animate-in slide-in-from-left-4 fade-in duration-300 fill-mode-backwards"
                   style={{ animationDelay: `${250 + (i * 50)}ms` }}
                 >
                   <div className="flex items-center gap-3">
                     <div 
                       className="w-6 h-6 rounded-none bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:text-cred-accent group-hover:border-cred-accent/30 transition-colors"
                     >
                       {m.name.substring(0,2).toUpperCase()}
                     </div>
                     <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{m.name}</span>
                   </div>
                   <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded-none border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                     {getTzDisplay(m.timezone)}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="p-6 pt-2 pb-8 sm:pb-6 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300 fill-mode-backwards">
          <button 
            onClick={handleCreate}
            className="w-full bg-cred-accent text-black font-bold py-3.5 px-4 rounded-none uppercase tracking-wider hover:bg-white hover:shadow-[0_0_25px_rgba(225,255,89,0.5)] transition-all duration-300 flex items-center justify-center gap-2 group transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Open Google Calendar <ExternalLink size={16} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </span>
            {/* Button Sheen Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite] pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
};