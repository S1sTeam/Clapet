import React, { useState, useRef, useEffect } from 'react';
import { ChevronIcon } from './Icons';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = 'Выберите', id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-select" id={id} ref={dropdownRef}>
      <div className="cs-trigger" onClick={() => setIsOpen(!isOpen)}>
        {selectedOpt?.icon && <div className="cs-trigger-icon">{selectedOpt.icon}</div>}
        <span className="cs-trigger-label">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <ChevronIcon className="cs-chevron" size={10} />
      </div>

      {isOpen && (
        <div className="cs-dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`cs-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.icon && <span className="cs-option-icon">{opt.icon}</span>}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
