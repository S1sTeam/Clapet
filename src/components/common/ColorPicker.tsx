import React from 'react';

interface ColorOption {
  color: string;
  title: string;
}

interface ColorPickerProps {
  label: string;
  value: string;
  options: ColorOption[];
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="setting-row">
      <label>{label}</label>
      <div className="color-picker-row">
        <div className="color-swatches">
          {options.map(opt => (
            <button
              key={opt.color}
              className={`color-swatch ${value.toLowerCase() === opt.color.toLowerCase() ? 'active' : ''}`}
              style={{ background: opt.color }}
              title={opt.title}
              onClick={() => onChange(opt.color)}
            />
          ))}
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            title="Свой цвет"
          />
        </div>
      </div>
    </div>
  );
};
