import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Member, TimeRange, AvailabilityType } from '../types';
import { TIMEZONE_CONFIG } from '../utils';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Member) => void;
  onDelete?: (id: string) => void;
  initialMember?: Member | null;
}

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
    { id: '1', start: '09:00', end: '17:00', type: 'preferred' }
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialMember) {
      setName(initialMember.name);
      setEmail(initialMember.email);
      setTimezone(initialMember.timezone);
      setRanges(initialMember.availability);
    } else {
      // Reset for new member
      setName('');
      setEmail('');
      // Default to browser timezone, but try to match it to our config if possible
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(browserTz);
      setRanges([{ id: Date.now().toString(), start: '09:00', end: '17:00', type: 'preferred' }]);
    }
    // Reset delete confirmation state when modal opens/changes
    setShowDeleteConfirm(false);
  }, [initialMember, isOpen]);

  if (!isOpen) return null;

  const handleAddRange = () => {
    setRanges([
      ...ranges,
      { id: Date.now().toString(), start: '09:00', end: '10:00', type: 'tentative' }
    ]);
  };

  const handleRemoveRange = (id: string) => {
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleRangeChange = (id: string, field: keyof TimeRange, value: string) => {
    setRanges(ranges.map(r => (r.id === id ? { ...r, [field]: value } : r)));
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-cred-card border border-cred-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-cred-border bg-cred-bg/50">
          <h2 className="text-xl font-mono tracking-wide text-cred-text uppercase font-bold">
            {initialMember ? 'Edit Member' : 'Add Member'}
          </h2>
          <button onClick={onClose} className="text-cred-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-cred-muted uppercase mb-1">Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-black border border-cred-border p-3 text-sm text-cred-text focus:border-cred-accent focus:outline-none transition-colors"
                placeholder="Ex: John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-cred-muted uppercase mb-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black border border-cred-border p-3 text-sm text-cred-text focus:border-cred-accent focus:outline-none transition-colors"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-cred-muted uppercase mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full bg-black border border-cred-border p-3 text-sm text-cred-text focus:border-cred-accent focus:outline-none transition-colors appearance-none"
              >
                {/* Render our config options first */}
                {TIMEZONE_CONFIG.map(tz => (
                  <option key={tz.id} value={tz.id}>
                    {tz.display} — {tz.label}
                  </option>
                ))}
                {/* If the current timezone isn't in our config, add it as a fallback option */}
                {!TIMEZONE_CONFIG.find(t => t.id === timezone) && (
                   <option value={timezone}>{timezone}</option>
                )}
              </select>
            </div>
          </div>

          {/* Availability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-cred-muted uppercase">Availability (Local Time)</label>
              <button
                type="button"
                onClick={handleAddRange}
                className="text-xs text-cred-accent hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Slot
              </button>
            </div>
            
            <div className="space-y-3">
              {ranges.map((range) => (
                <div key={range.id} className="flex items-center gap-2 p-3 bg-black/40 border border-cred-border">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={range.start}
                      onChange={e => handleRangeChange(range.id, 'start', e.target.value)}
                      className="bg-transparent text-white text-sm focus:outline-none font-mono"
                    />
                    <input
                      type="time"
                      value={range.end}
                      onChange={e => handleRangeChange(range.id, 'end', e.target.value)}
                      className="bg-transparent text-white text-sm focus:outline-none font-mono"
                    />
                  </div>
                  
                  <select
                    value={range.type}
                    onChange={e => handleRangeChange(range.id, 'type', e.target.value as AvailabilityType)}
                    className={`bg-transparent text-xs font-bold uppercase focus:outline-none ${range.type === 'preferred' ? 'text-cred-accent' : 'text-zinc-500'}`}
                  >
                    <option value="preferred">Preferred</option>
                    <option value="tentative">Tentative</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveRange(range.id)}
                    className="text-cred-muted hover:text-cred-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-cred-border">
            {initialMember && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <span className="text-xs font-bold text-cred-danger uppercase mr-1">Sure?</span>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="bg-cred-danger text-white px-3 py-2 text-xs font-bold uppercase hover:bg-red-600 transition-colors"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="bg-zinc-800 text-zinc-300 px-3 py-2 text-xs font-bold uppercase hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="text-cred-danger text-sm font-bold uppercase hover:opacity-80 cursor-pointer flex items-center gap-1 group"
                >
                  <Trash2 size={16} className="group-hover:scale-110 transition-transform" /> Delete
                </button>
              )
            ) : <div />}
            
            <button
              type="submit"
              className="bg-cred-text text-black px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white transition-transform active:scale-95 cursor-pointer"
            >
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};