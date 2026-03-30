import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  theme?: 'orange' | 'blue';
  error?: boolean;
}

export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Выберите...', 
  disabled,
  theme = 'orange',
  error
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const themeClasses = {
    orange: {
      ring: 'focus:ring-orange-500/20 focus:border-orange-500',
      activeRing: 'border-orange-500 ring-2 ring-orange-500/20',
      hoverBg: 'hover:bg-orange-50',
      activeBg: 'bg-orange-50 text-orange-600',
    },
    blue: {
      ring: 'focus:ring-blue-500/20 focus:border-blue-500',
      activeRing: 'border-blue-500 ring-2 ring-blue-500/20',
      hoverBg: 'hover:bg-blue-50',
      activeBg: 'bg-blue-50 text-blue-600',
    }
  };

  const t = themeClasses[theme];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-lg p-3 bg-gray-50 outline-none transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : t.ring} ${isOpen ? t.activeRing : ''} ${error ? 'border-2 border-red-500' : 'border border-gray-300'}`}
      >
        <span className={`block break-words whitespace-normal text-left ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors break-words whitespace-normal ${value === option.value ? `${t.activeBg} font-medium` : `text-gray-700 ${t.hoverBg}`}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
