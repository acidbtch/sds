import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

export type DaySchedule = {
  active: boolean;
  start: string;
  end: string;
};

export type WeeklySchedule = {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
};

export const defaultSchedule: WeeklySchedule = {
  mon: { active: true, start: '09:00', end: '18:00' },
  tue: { active: true, start: '09:00', end: '18:00' },
  wed: { active: true, start: '09:00', end: '18:00' },
  thu: { active: true, start: '09:00', end: '18:00' },
  fri: { active: true, start: '09:00', end: '18:00' },
  sat: { active: false, start: '10:00', end: '16:00' },
  sun: { active: false, start: '10:00', end: '16:00' },
};

const daysMap = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс'
};

const daysOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const formatSchedule = (schedule: WeeklySchedule | string | undefined | null): string => {
  if (!schedule) return 'Пн-Пт 09:00-18:00';
  if (typeof schedule === 'string') return schedule;
  
  const groups: { days: string[], start: string, end: string, active: boolean }[] = [];
  
  let currentGroup: { days: string[], start: string, end: string, active: boolean } | null = null;

  daysOrder.forEach((dayKey) => {
    const day = schedule[dayKey];
    if (!currentGroup) {
      currentGroup = { days: [dayKey], start: day.start, end: day.end, active: day.active };
    } else {
      if (currentGroup.active === day.active && (!day.active || (currentGroup.start === day.start && currentGroup.end === day.end))) {
        currentGroup.days.push(dayKey);
      } else {
        groups.push(currentGroup);
        currentGroup = { days: [dayKey], start: day.start, end: day.end, active: day.active };
      }
    }
  });
  if (currentGroup) {
    groups.push(currentGroup);
  }

  const formatDays = (days: string[]) => {
    if (days.length === 1) return daysMap[days[0] as keyof typeof daysMap];
    if (days.length === 2) return `${daysMap[days[0] as keyof typeof daysMap]}, ${daysMap[days[1] as keyof typeof daysMap]}`;
    return `${daysMap[days[0] as keyof typeof daysMap]}-${daysMap[days[days.length - 1] as keyof typeof daysMap]}`;
  };

  return groups.map(g => {
    const daysStr = formatDays(g.days);
    if (!g.active) return `${daysStr} - выходной`;
    return `${daysStr}: ${g.start} - ${g.end}`;
  }).join(', ');
};

interface ScheduleSelectorProps {
  value: WeeklySchedule | string;
  onChange: (schedule: WeeklySchedule) => void;
  className?: string;
}

export const ScheduleSelector: React.FC<ScheduleSelectorProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // If value is a string, we use defaultSchedule as fallback for the UI
  const scheduleData = typeof value === 'string' ? defaultSchedule : value;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayChange = (dayKey: keyof WeeklySchedule, field: keyof DaySchedule, val: any) => {
    onChange({
      ...scheduleData,
      [dayKey]: {
        ...scheduleData[dayKey],
        [field]: val
      }
    });
  };

  const formattedText = formatSchedule(value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center justify-between text-left focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 truncate">{formattedText}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="space-y-3">
            {daysOrder.map((dayKey) => {
              const day = scheduleData[dayKey];
              return (
                <div key={dayKey} className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer w-20">
                    <input
                      type="checkbox"
                      checked={day.active}
                      onChange={(e) => handleDayChange(dayKey, 'active', e.target.checked)}
                      className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{daysMap[dayKey]}</span>
                  </label>
                  
                  <div className={`flex items-center gap-2 flex-1 transition-opacity ${day.active ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <input
                      type="time"
                      value={day.start}
                      onChange={(e) => handleDayChange(dayKey, 'start', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={day.end}
                      onChange={(e) => handleDayChange(dayKey, 'end', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 bg-blue-50 text-blue-600 font-medium py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
          >
            Готово
          </button>
        </div>
      )}
    </div>
  );
};
