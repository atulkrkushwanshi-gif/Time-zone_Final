export type AvailabilityType = 'preferred' | 'tentative';

export interface TimeRange {
  id: string;
  start: string; // HH:mm format (24h)
  end: string;   // HH:mm format (24h)
  type: AvailabilityType;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  timezone: string;
  availability: TimeRange[];
}

export interface DragSelection {
  start: Date | null;
  end: Date | null;
}

export interface CalendarEventDetails {
  startTime: Date;
  endTime: Date;
  guests: string[];
}