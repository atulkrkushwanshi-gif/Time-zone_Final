import React, { useState, useEffect } from 'react';
import { Timeline } from './components/Timeline';
import { MemberModal } from './components/MemberModal';
import { GoogleCalendarBridge } from './components/GoogleCalendarBridge';
import { Member } from './types';
import { getTzDisplay } from './utils';

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'You',
    email: 'you@example.com',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    availability: [
      { id: '101', start: '09:00', end: '12:00', type: 'preferred', days: [1, 2, 3, 4, 5] },
      { id: '102', start: '13:00', end: '18:00', type: 'preferred', days: [1, 2, 3, 4, 5] }
    ]
  },
  {
    id: '2',
    name: 'Sarah (London)',
    email: 'sarah@example.com',
    timezone: 'Europe/London',
    availability: [
      { id: '201', start: '10:00', end: '16:00', type: 'preferred', days: [1, 2, 3, 4, 5] }
    ]
  },
  {
    id: '3',
    name: 'Raj (India)',
    email: 'raj@example.com',
    timezone: 'Asia/Kolkata',
    availability: [
      { id: '301', start: '11:00', end: '20:00', type: 'preferred', days: [1, 2, 3, 4, 5] }
    ]
  }
];

interface SchedulerProps {
  className?: string;
  initialMembers?: Member[];
}

export default function App({ 
  className = "h-screen w-screen", 
  initialMembers = DEFAULT_MEMBERS 
}: SchedulerProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  // Bridge State
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [selection, setSelection] = useState<{start: Date; end: Date} | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveMember = (member: Member) => {
    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === member.id ? member : m));
    } else {
      setMembers(prev => [...prev, member]);
    }
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setIsMemberModalOpen(false);
  };

  const handleSelectRange = (start: Date, end: Date) => {
    setSelection({ start, end });
    setIsBridgeOpen(true);
  };

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const tzDisplay = getTzDisplay(userTz);

  return (
    <div className={`flex flex-col bg-cred-bg text-cred-text overflow-hidden font-sans relative ${className}`}>
      
      {/* Header */}
      <header className="h-[60px] border-b border-cred-border flex items-center justify-between px-6 bg-black z-30 shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-white leading-none">Schedule M</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Current Time Display */}
           <div className="hidden md:flex flex-col items-end mr-4">
             <span className="text-[10px] text-zinc-500 uppercase font-bold">Your Time</span>
             <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono text-white font-bold tracking-tight">
                  {timeStr}
                </span>
                <span className="text-xs font-mono text-cred-accent font-bold">
                  {tzDisplay}
                </span>
             </div>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <Timeline 
          members={members}
          onSelectRange={handleSelectRange}
          onEditMember={(m) => {
            setEditingMember(m);
            setIsMemberModalOpen(true);
          }}
          onAddMember={() => {
            setEditingMember(null);
            setIsMemberModalOpen(true);
          }}
        />
      </main>

      {/* Modals */}
      <MemberModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        initialMember={editingMember}
      />

      {selection && (
        <GoogleCalendarBridge 
          isOpen={isBridgeOpen}
          onClose={() => setIsBridgeOpen(false)}
          startTime={selection.start}
          endTime={selection.end}
          selectedMembers={members}
        />
      )}
    </div>
  );
}