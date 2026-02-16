import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Member, TimeRange, AvailabilityType } from '../types';
import { TIMEZONE_CONFIG } from '../utils';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  onDelete?: (id: string) => void;
  initialMember?: Member | null;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialMember
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [ranges, setRanges] = useState<TimeRange[]>([
    { id: '1', start: '09:00', end: '17:00', type: 'preferred', days: [1, 2, 3, 4, 5] }
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Animation mounting state
  const [isMounting, setIsMounting] = useState(false);

  useEffect(() => {
    if (isOpen) setIsMounting(true);
  }, [isOpen]);

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name);
      setEmail(initialMember.email);
      setTimezone(initialMember.timezone);
      const sanitizedRanges = initialMember.availability.map(r => ({
        ...r,
        days: r.days || [1, 2, 3, 4, 5]
      }));
      setRanges(sanitizedRanges);
    } else {
      setName('');
      setEmail('');
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(browserTz);
      setRanges([{ id: Date.now().toString(), start: '09:00', end: '17:00', type: 'preferred', days: [1, 2, 3, 4, 5] }]);
    }
    setShowDeleteConfirm(false);
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleAddRange = () => {
    setRanges([
      ...ranges,
      { id: Date.now().toString(), start: '09:00', end: '10:00', type: 'tentative', days: [1, 2, 3, 4, 5] }
    ]);
  };

  const handleRemoveRange = (id: string) => {
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleRangeChange = (id: string, field: keyof TimeRange, value: any) => {
    setRanges(ranges.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const toggleDay = (rangeId: string, dayIndex: number) => {
    setRanges(ranges.map(r => {
      if (r.id !== rangeId) return r;
      const newDays = r.days.includes(dayIndex)
        ? r.days.filter(d => d !== dayIndex)
        : [...r.days, dayIndex].sort();
      return { ...r, days: newDays };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialMember ? initialMember.id : Date.now().toString(),
      name,
      email,
      timezone,
      availability: ranges
    });
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (initialMember && onDelete) {
      onDelete(initialMember.id);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop with Blur and Fade */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 ease-out" 
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div 
        className={`
          w-full sm:max-w-lg bg-[#0A0A0A] border-t sm:border border-cred-border/60 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.8)] 
          rounded-none overflow-hidden relative z-10
          animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 sm:zoom-in-95 fade-in duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        `}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing" onClick={onClose}>
           <div className="w-12 h-1 bg-zinc-800 rounded-none" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-mono tracking-wide text-zinc-100 uppercase font-bold flex items-center gap-2">
            {initialMember ? 'Edit Member' : 'Add Member'}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-none bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all duration-300 hover:rotate-90 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] sm:max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Basic Info */}
          <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100 fill-mode-backwards">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-none p-3 text-sm text-zinc-200 focus:border-cred-accent/50 focus:ring-1 focus:ring-cred-accent/50 focus:outline-none transition-all duration-300 focus:bg-zinc-900"
                placeholder="Ex: John Doe"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-none p-3 text-sm text-zinc-200 focus:border-cred-accent/50 focus:ring-1 focus:ring-cred-accent/50 focus:outline-none transition-all duration-300 focus:bg-zinc-900"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Timezone</label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-none p-3 text-sm text-zinc-200 focus:border-cred-accent/50 focus:ring-1 focus:ring-cred-accent/50 focus:outline-none transition-all duration-300 focus:bg-zinc-900 appearance-none"
                >
                  {TIMEZONE_CONFIG.map(tz => (
                    <option key={tz.id} value={tz.id}>
                      {tz.display} — {tz.label}
                    </option>
                  ))}
                  {!TIMEZONE_CONFIG.find(t => t.id === timezone) && (
                     <option value={timezone}>{timezone}</option>
                  )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200 fill-mode-backwards">
            <div className="flex items-center justify-between mb-3 border-t border-zinc-800 pt-4">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Availability</label>
              <button
                type="button"
                onClick={handleAddRange}
                className="text-[10px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-none hover:border-cred-accent hover:text-cred-accent transition-all flex items-center gap-1 active:scale-95"
              >
                <Plus size={12} /> ADD SLOT
              </button>
            </div>
            
            <div className="space-y-3">
              {ranges.map((range) => (
                <div 
                  key={range.id} 
                  className="flex flex-col p-3 bg-zinc-900/30 border border-zinc-800 rounded-none gap-3 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2 bg-black/40 rounded-none p-1 border border-zinc-800/50">
                      <input
                        type="time"
                        value={range.start}
                        onChange={e => handleRangeChange(range.id, 'start', e.target.value)}
                        className="bg-transparent text-white text-sm focus:outline-none font-mono text-center hover:text-cred-accent focus:text-cred-accent transition-colors cursor-pointer"
                      />
                      <input
                        type="time"
                        value={range.end}
                        onChange={e => handleRangeChange(range.id, 'end', e.target.value)}
                        className="bg-transparent text-white text-sm focus:outline-none font-mono text-center hover:text-cred-accent focus:text-cred-accent transition-colors cursor-pointer border-l border-zinc-800"
                      />
                    </div>
                    
                    <div className="relative">
                      <select
                        value={range.type}
                        onChange={e => handleRangeChange(range.id, 'type', e.target.value as AvailabilityType)}
                        className={`bg-transparent text-[10px] font-bold uppercase focus:outline-none cursor-pointer appearance-none border border-zinc-800 rounded-none px-2 py-1.5 pr-6 ${range.type === 'preferred' ? 'text-cred-accent border-cred-accent/20 bg-cred-accent/5' : 'text-zinc-500'}`}
                      >
                        <option value="preferred">Preferred</option>
                        <option value="tentative">Tentative</option>
                      </select>
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                          <svg width="8" height="4" viewBox="0 0 10 6" fill="none" stroke="currentColor"><path d="M1 1L5 5L9 1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                       </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRange(range.id)}
                      className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-cred-danger hover:bg-cred-danger/10 rounded-none transition-all active:scale-90"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {/* Day Selector Chips */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex justify-between w-full">
                      {DAYS.map((label, i) => {
                        const isSelected = range.days.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleDay(range.id, i)}
                            className={`
                              w-8 h-8 rounded-none text-[10px] font-bold flex items-center justify-center border transition-all duration-300
                              ${isSelected 
                                ? 'bg-cred-accent text-black border-cred-accent shadow-[0_0_10px_rgba(225,255,89,0.3)] scale-105' 
                                : 'bg-transparent text-zinc-600 border-zinc-800/50 hover:border-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30'
                              }
                            `}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50 mt-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300 fill-mode-backwards">
            {initialMember && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-xs font-bold text-cred-danger uppercase mr-1">Sure?</span>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="bg-cred-danger/20 border border-cred-danger text-cred-danger px-3 py-2 rounded-none text-xs font-bold uppercase hover:bg-cred-danger hover:text-white transition-all"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="bg-zinc-800 text-zinc-400 px-3 py-2 rounded-none text-xs font-bold uppercase hover:bg-zinc-700 transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="text-zinc-500 text-xs font-bold uppercase hover:text-cred-danger cursor-pointer flex items-center gap-1.5 group px-2 py-2 rounded-none hover:bg-zinc-900 transition-all"
                >
                  <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> 
                  <span className="group-hover:underline decoration-zinc-800 underline-offset-4">Delete</span>
                </button>
              )
            ) : <div />}
            
            <button
              type="submit"
              className="bg-zinc-100 text-black px-8 py-3 rounded-none text-xs font-bold uppercase tracking-wider hover:bg-cred-accent hover:shadow-[0_0_25px_rgba(225,255,89,0.4)] transition-all duration-300 active:scale-95 cursor-pointer transform hover:-translate-y-0.5 ml-auto"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};