import { format, addMinutes, startOfDay, differenceInMinutes, addDays, subDays } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { Member } from './types';

// Constants
export const PIXELS_PER_MINUTE = 2.0; // Slightly reduced for better long-range view
export const TIMELINE_DAYS_BACK = 2; // Start 2 days ago
export const TIMELINE_DAYS_FORWARD = 28; // Go 4 weeks forward
export const TOTAL_MINUTES_PER_DAY = 24 * 60;

export const TIMEZONE_CONFIG = [
  { id: "UTC", label: "Coordinated Universal Time", display: "UTC" },
  { id: "America/New_York", label: "Eastern Time", display: "EST/EDT" },
  { id: "America/Los_Angeles", label: "Pacific Time", display: "PST/PDT" },
  { id: "America/Chicago", label: "Central Time", display: "CST/CDT" },
  { id: "Europe/London", label: "United Kingdom", display: "GMT/BST" },
  { id: "Europe/Paris", label: "Central European Time", display: "CET" },
  { id: "Europe/Berlin", label: "Central European Time", display: "CET" },
  { id: "Asia/Kolkata", label: "India Standard Time", display: "IST" },
  { id: "Asia/Tokyo", label: "Japan Standard Time", display: "JST" },
  { id: "Australia/Sydney", label: "Australian Eastern Time", display: "AEST" },
  { id: "Pacific/Auckland", label: "New Zealand Time", display: "NZST" },
];

export const getTzDisplay = (iana: string): string => {
  const found = TIMEZONE_CONFIG.find(t => t.id === iana);
  return found ? found.display : iana;
};

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export const dateToPixels = (date: Date, timelineStart: Date): number => {
  const minutes = differenceInMinutes(date, timelineStart);
  return minutes * PIXELS_PER_MINUTE;
};

export const pixelsToDate = (pixels: number, timelineStart: Date): Date => {
  const minutes = pixels / PIXELS_PER_MINUTE;
  const raw = addMinutes(timelineStart, minutes);
  // Snap to 15 mins
  const remainder = raw.getMinutes() % 15;
  return addMinutes(raw, -remainder);
};

export const getMemberDateString = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

export const getMemberTimeString = (date: Date, timezone: string) => {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
};

// Helper to find a specific time in a timezone converted to Viewer Date (UTC timestamp)
export const getZonedTimeAsDate = (dateStr: string, timeStr: string, timezone: string): Date => {
  // dateStr: YYYY-MM-DD, timeStr: HH:mm
  return fromZonedTime(`${dateStr} ${timeStr}`, timezone);
};

export const generateGoogleCalendarUrl = (details: {
  startTime: Date;
  endTime: Date;
  title: string;
  description: string;
  guests: string[];
}): string => {
  const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss");
  
  const start = formatDate(details.startTime);
  const end = formatDate(details.endTime);
  const detailsParam = encodeURIComponent(details.description);
  const textParam = encodeURIComponent(details.title);
  const emailsParam = details.guests.join(',');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textParam}&dates=${start}/${end}&details=${detailsParam}&add=${emailsParam}`;
};