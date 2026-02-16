import React, { useRef, useState, useEffect, useMemo } from 'react';
import { format, startOfDay, addDays, subDays, addMinutes, isBefore, isAfter } from 'date-fns';
import { Member } from '../types';
import { 
  PIXELS_PER_MINUTE, 
  TIMELINE_DAYS_BACK, 
  TIMELINE_DAYS_FORWARD,
  dateToPixels, 
  pixelsToDate, 
  getTzDisplay,
  getMemberDateString,
  getMemberTimeString,
  getZonedTimeAsDate
} from '../utils';
import { Users, Plus } from 'lucide-react';

interface TimelineProps {
  members: Member[];
  onSelectRange: (start: Date, end: Date) => void;
  onEditMember: (member: Member) => void;
  onAddMember: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({ members, onSelectRange, onEditMember, onAddMember }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State for hover
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);

  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [selectionStartX, setSelectionStartX] = useState<number | null>(null);
  const [currentMouseX, setCurrentMouseX] = useState<number | null>(null);

  // Initialize timeline start (Yesterday)
  const [timelineStart] = useState(() => startOfDay(subDays(new Date(), TIMELINE_DAYS_BACK)));

  // Derived constants
  const totalDays = TIMELINE_DAYS_BACK + TIMELINE_DAYS_FORWARD;
  const totalWidth = totalDays * 24 * 60 * PIXELS_PER_MINUTE;
  const daysArray = useMemo(() => Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i)), [timelineStart, totalDays]);

  // Initial Scroll Position
  useEffect(() => {
    // Scroll to Current Time - 2 Hours
    if (containerRef.current) {
        const now = new Date();
        const targetDate = addMinutes(now, -120); // 2 hours ago
        const pixels = dateToPixels(targetDate, timelineStart);
        containerRef.current.scrollLeft = Math.max(0, pixels);
    }
  }, [timelineStart]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const SNAP_PIXELS = 15 * PIXELS_PER_MINUTE;

  const snapToGrid = (x: number) => {
    return Math.round(x / SNAP_PIXELS) * SNAP_PIXELS;
  };

  // --- Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + containerRef.current!.scrollLeft;
    
    setIsDragging(true);
    setSelectionStartX(x);
    setCurrentMouseX(x);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !containerRef.current) return;
    
    const scrollLeft = containerRef.current.scrollLeft;
    const x = e.clientX - rect.left + scrollLeft;
    
    // Update hover date
    const dateAtCursor = pixelsToDate(x, timelineStart);
    setHoveredDate(dateAtCursor);
    
    // Track screen coordinates for the floating card
    setMousePos({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      setCurrentMouseX(x);
    } else {
      // Just track for crosshair
      setCurrentMouseX(x);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectionStartX !== null && currentMouseX !== null) {
      const rawStart = Math.min(selectionStartX, currentMouseX);
      const rawEnd = Math.max(selectionStartX, currentMouseX);
      const startX = snapToGrid(rawStart);
      const endX = snapToGrid(rawEnd);
      
      if (endX - startX >= SNAP_PIXELS) {
        const dateStart = pixelsToDate(startX, timelineStart);
        const dateEnd = pixelsToDate(endX, timelineStart);
        onSelectRange(dateStart, dateEnd);
      }
    }
    setIsDragging(false);
    setSelectionStartX(null);
    setCurrentMouseX(null);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
    setHoveredDate(null);
    setMousePos(null);
    setCurrentMouseX(null);
  };

  // --- Render Helpers ---

  const renderMemberAvailability = (member: Member) => {
    return daysArray.map((dayDate, dayIdx) => {
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      const dayOfWeek = dayDate.getDay(); // 0 = Sunday, 1 = Monday...
      
      return member.availability.map((range, rangeIdx) => {
        try {
          // Check if this range applies to this day of the week
          if (range.days && !range.days.includes(dayOfWeek)) {
            return null;
          }

          const startObj = getZonedTimeAsDate(dayStr, range.start, member.timezone);
          const endObj = getZonedTimeAsDate(dayStr, range.end, member.timezone);
          
          let effectiveEnd = endObj;
          if (isBefore(endObj, startObj)) {
            effectiveEnd = addDays(endObj, 1);
          }

          const startPx = dateToPixels(startObj, timelineStart);
          const endPx = dateToPixels(effectiveEnd, timelineStart);
          const width = Math.max(0, endPx - startPx);

          if (width === 0) return null;

          return (
            <div
              key={`${member.id}-${dayIdx}-${range.id}`}
              className={`absolute h-8 top-1/2 -translate-y-1/2 transition-all duration-300 rounded-sm cursor-pointer origin-center
                ${range.type === 'preferred' 
                  ? 'bg-cred-accent/80 border-y border-cred-accent/40 hover:bg-cred-accent hover:shadow-[0_0_20px_rgba(225,255,89,0.5)] hover:scale-[1.02] hover:z-20' 
                  : 'bg-zinc-800/80 border border-zinc-700 bg-[url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==")] opacity-50 hover:opacity-80 hover:scale-[1.01] hover:brightness-125'}
              `}
              style={{ left: startPx, width: width }}
            />
          );
        } catch (e) {
          return null;
        }
      });
    });
  };

  const renderMemberDateBadges = (member: Member) => {
    return daysArray.map((dayDate, i) => {
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      const midnightObj = getZonedTimeAsDate(dayStr, '00:00', member.timezone);
      const px = dateToPixels(midnightObj, timelineStart);
      
      const displayDate = new Intl.DateTimeFormat('en-US', {
        timeZone: member.timezone,
        month: 'short',
        day: 'numeric'
      }).format(midnightObj);

      const displayDay = new Intl.DateTimeFormat('en-US', {
        timeZone: member.timezone,
        weekday: 'short'
      }).format(midnightObj).toUpperCase();

      return (
        <div 
          key={`badge-${member.id}-${i}`}
          className="absolute top-0 bottom-0 flex flex-col justify-center border-l-2 border-dashed border-zinc-700/50 pl-2 pointer-events-none select-none group-hover:border-zinc-500 transition-colors duration-300"
          style={{ left: px }}
        >
          <div className="bg-zinc-900/80 text-[10px] font-bold text-zinc-400 px-2 py-1 rounded-none border border-zinc-800 whitespace-nowrap backdrop-blur-sm group-hover:text-zinc-200 group-hover:border-zinc-600 transition-colors duration-300">
             <span className="text-zinc-500 mr-1 group-hover:text-cred-accent transition-colors">{displayDay}</span>
             <span className="text-zinc-300">{displayDate}</span>
          </div>
        </div>
      );
    });
  };

  const nowPx = dateToPixels(currentTime, timelineStart);

  let overlayLeft = 0;
  let overlayWidth = 0;
  if (selectionStartX !== null && currentMouseX !== null) {
    const min = Math.min(selectionStartX, currentMouseX);
    const max = Math.max(selectionStartX, currentMouseX);
    overlayLeft = snapToGrid(min);
    overlayWidth = snapToGrid(max) - overlayLeft;
  }

  const mouseLine = hoveredDate && currentMouseX !== null ? (
     <div 
       className="absolute top-0 bottom-0 border-l border-dashed border-cred-accent/50 pointer-events-none z-40"
       style={{ left: currentMouseX }}
     />
  ) : null;

  return (
    <div className="flex flex-col w-full h-full bg-cred-bg overflow-hidden relative select-none">
      
      {/* --- Sidebar --- */}
      <div className="absolute left-0 top-[60px] bottom-0 w-56 bg-cred-bg border-r border-cred-border z-30 flex flex-col shadow-2xl">
        <div className="h-20 border-b border-cred-border flex items-center px-4 bg-cred-card/50 backdrop-blur shrink-0">
          <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center text-cred-accent mr-3 border border-zinc-700 rounded-none">
            <Users size={16} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-cred-text">Team Sync</span>
        </div>

        <div className="flex-1 overflow-hidden overflow-y-auto no-scrollbar">
          {members.map(member => {
            // Sidebar ALWAYS shows current time now
            const dateStr = getMemberDateString(currentTime, member.timezone);
            const timeStr = getMemberTimeString(currentTime, member.timezone);

            return (
              <div 
                key={member.id} 
                onClick={() => onEditMember(member)}
                className="h-20 border-b border-cred-border/50 flex items-center px-4 hover:bg-zinc-900/50 cursor-pointer group transition-colors relative overflow-hidden"
              >
                {/* Subtle highlight bar on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cred-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="w-8 h-8 bg-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-white mr-3 border border-zinc-700 group-hover:border-cred-accent/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 rounded-none shrink-0 shadow-lg">
                  {member.name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate text-zinc-300 group-hover:text-white mb-0.5 transition-transform duration-300 group-hover:translate-x-1">{member.name}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-mono font-bold leading-none text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      {timeStr}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono mt-0.5 flex justify-between items-center gap-2">
                       <span>{getTzDisplay(member.timezone)}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-cred-border bg-black/50 shrink-0">
          <button 
            onClick={onAddMember}
            className="w-full h-10 flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:border-cred-accent hover:bg-zinc-800 text-white transition-all duration-200 group rounded-none hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={20} className="text-zinc-400 group-hover:text-cred-accent transition-transform duration-300 group-hover:rotate-90" />
            <span className="ml-2 text-xs font-bold uppercase text-zinc-400 group-hover:text-white">Add Member</span>
          </button>
        </div>
      </div>

      {/* --- Timeline Area --- */}
      <div 
        ref={containerRef}
        className="ml-56 h-full overflow-x-auto overflow-y-hidden relative no-scrollbar cursor-crosshair bg-[#050505]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ width: totalWidth, height: '100%' }} className="relative bg-[linear-gradient(to_right,#18181b_1px,transparent_1px)] bg-[size:120px_100%]">
          
          {/* Header (Days & Hours) */}
          <div className="h-[60px] border-b border-cred-border sticky top-0 bg-cred-bg/95 z-20 backdrop-blur-sm flex">
            {daysArray.map((day, i) => {
              const dayPx = dateToPixels(day, timelineStart);
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                 <div key={i} className="absolute h-full border-l border-zinc-800" style={{ left: dayPx, width: 24 * 60 * PIXELS_PER_MINUTE }}>
                    <div className={`absolute top-2 left-2 text-xs font-bold uppercase tracking-widest ${isToday ? 'text-cred-accent' : 'text-zinc-500'}`}>
                       {isToday ? 'Today' : format(day, 'EEE, MMM dd')}
                    </div>
                    {Array.from({ length: 24 }).map((_, h) => {
                      // Convert 0-23 to 12h format
                      const hourLabel = h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
                      
                      return (
                        <div key={h} className="absolute bottom-0 h-3 border-l border-zinc-800" style={{ left: h * 60 * PIXELS_PER_MINUTE }}>
                           <span className="absolute bottom-4 -left-3 text-[10px] font-mono text-zinc-600 whitespace-nowrap">
                             {hourLabel}
                           </span>
                        </div>
                      );
                    })}
                 </div>
              );
            })}
          </div>

          {/* Rows */}
          <div className="relative">
            <div className="h-20 border-b border-cred-border relative bg-zinc-900/10"></div>
            {members.map((member, idx) => (
              <div key={member.id} className="h-20 border-b border-cred-border/30 relative hover:bg-white/5 transition-colors duration-200 group">
                 {renderMemberDateBadges(member)}
                 {renderMemberAvailability(member)}
              </div>
            ))}
          </div>

          {/* Current Time Line */}
          <div 
            className="absolute top-[60px] bottom-0 w-0.5 bg-cred-accent z-30 shadow-[0_0_15px_rgba(225,255,89,0.8)] pointer-events-none"
            style={{ left: nowPx }}
          >
            {/* Pulsing Dot at top */}
            <div className="absolute -top-1.5 -left-[3px] w-2 h-2 bg-cred-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(225,255,89,1)]" />
            
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cred-accent text-black text-[9px] font-bold px-1.5 py-0.5 rounded-none font-mono whitespace-nowrap shadow-lg">
              {format(currentTime, 'h:mm a')}
            </div>
          </div>

          {/* Drag Overlay Selection Box */}
          {selectionStartX !== null && currentMouseX !== null && overlayWidth > 0 && (
            <div 
              className="absolute top-[60px] bottom-0 bg-cred-accent/10 border-x border-cred-accent/30 z-20 pointer-events-none backdrop-blur-[1px] animate-in fade-in duration-200"
              style={{
                left: overlayLeft,
                width: overlayWidth
              }}
            />
          )}

          {/* Drag Duration Badge - Left of Cursor */}
          {selectionStartX !== null && currentMouseX !== null && overlayWidth > 0 && (
             <div 
                className="absolute top-[80px] z-50 bg-black/90 text-cred-accent text-xs px-3 py-1.5 border border-cred-border font-mono whitespace-nowrap rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-none flex items-center justify-center min-w-[60px] animate-in zoom-in-95 duration-100"
                style={{
                  left: currentMouseX,
                  transform: 'translateX(calc(-100% - 12px))'
                }}
             >
                 {(() => {
                   const totalMinutes = Math.round(overlayWidth / PIXELS_PER_MINUTE);
                   const hours = Math.floor(totalMinutes / 60);
                   const minutes = totalMinutes % 60;
                   let str = '';
                   if (hours > 0) str += `${hours}h `;
                   if (minutes > 0 || hours === 0) str += `${minutes}m`;
                   return str.trim();
                 })()}
             </div>
          )}
          
          {/* Hover Crosshair (Mouse Line) */}
          {mouseLine}

        </div>
      </div>

      {/* Floating Hover Card */}
      {hoveredDate && mousePos && (
        <div 
          className="fixed z-50 pointer-events-none bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-none p-3 shadow-2xl flex flex-col gap-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
          style={{ 
            top: mousePos.y + 20, 
            left: Math.min(mousePos.x + 20, window.innerWidth - 220) // prevent overflow right
          }}
        >
          {members.map(member => {
            const dateStr = getMemberDateString(hoveredDate, member.timezone);
            const timeStr = getMemberTimeString(hoveredDate, member.timezone);
            return (
              <div key={member.id} className="flex flex-col mb-2 last:mb-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-zinc-300 font-bold mr-4">{member.name}</span>
                  <span className="text-xs font-mono text-cred-accent">{timeStr}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-600 font-mono">
                  <span>{getTzDisplay(member.timezone)}</span>
                  <span>{dateStr}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};