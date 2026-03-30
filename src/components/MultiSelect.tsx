import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  theme?: 'orange' | 'blue';
  error?: boolean;
}

export function MultiSelect({ 
  values, 
  onChange, 
  options, 
  placeholder = 'Выберите...', 
  disabled,
  theme = 'orange',
  error
}: MultiSelectProps) {
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

  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const selectedLabels = values
    .map(v => options.find(opt => opt.value === v)?.label)
    .filter(Boolean)
    .join(', ');

  const themeClasses = {
    orange: {
      ring: 'focus:ring-orange-500/20 focus:border-orange-500',
      activeRing: 'border-orange-500 ring-2 ring-orange-500/20',
      hoverBg: 'hover:bg-orange-50',
      activeBg: 'bg-orange-50 text-orange-600',
      checkbox: 'text-orange-600 focus:ring-orange-500',
    },
    blue: {
      ring: 'focus:ring-blue-500/20 focus:border-blue-500',
      activeRing: 'border-blue-500 ring-2 ring-blue-500/20',
      hoverBg: 'hover:bg-blue-50',
      activeBg: 'bg-blue-50 text-blue-600',
      checkbox: 'text-blue-600 focus:ring-blue-500',
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
        <span className={`block break-words whitespace-normal text-left ${values.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
          {values.length > 0 ? selectedLabels : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleOption(option.value);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm transition-colors break-words whitespace-normal ${isSelected ? `${t.activeBg} font-medium` : `text-gray-700 ${t.hoverBg}`}`}
              >
                <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-current border-current' : 'border-gray-300 bg-white'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-left">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
