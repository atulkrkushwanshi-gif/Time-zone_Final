import React from 'react';
import { Calendar, X, ExternalLink } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-cred-card border border-cred-border shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-cred-border bg-gradient-to-b from-zinc-900 to-black">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-cred-accent/10 border border-cred-accent/20">
              <Calendar className="text-cred-accent" size={24} />
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Create Calendar Event</h2>
          <p className="text-zinc-500 text-sm">Review details before redirecting to Google Calendar.</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center p-4 bg-zinc-900/50 border border-zinc-800">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Date</p>
              <p className="text-white font-mono">{format(startTime, 'MMM dd, yyyy')}</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Time</p>
               <p className="text-cred-accent font-mono font-bold">
                 {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
               </p>
            </div>
          </div>

          <div>
             <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Participants ({selectedMembers.length})</p>
             <div className="max-h-32 overflow-y-auto no-scrollbar space-y-2">
               {selectedMembers.map(m => (
                 <div key={m.id} className="flex items-center justify-between text-sm text-zinc-400">
                   <span className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-zinc-600" />
                     {m.name}
                   </span>
                   <span className="text-[10px] font-mono text-zinc-600">{getTzDisplay(m.timezone)}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button 
            onClick={handleCreate}
            className="w-full bg-cred-accent text-black font-bold py-3 px-4 uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            Open Google Calendar <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};