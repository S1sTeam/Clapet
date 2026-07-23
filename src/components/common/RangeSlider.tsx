import React from 'react';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (val: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ label, min, max, step = 1, value, unit = '', onChange }) => {
  return (
    <div className="setting-row">
      <label>{label}</label>
      <div className="setting-control">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className="range-val">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
    </div>
  );
};
