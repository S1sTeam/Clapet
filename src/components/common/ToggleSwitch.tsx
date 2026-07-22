import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, id }) => {
  return (
    <label 
      className="toggle-row" 
      id={id}
      onClick={e => {
        e.preventDefault();
        onChange(!checked);
      }}
    >
      <span>{label}</span>
      <span className={`toggle-switch ${checked ? 'on' : ''}`}>
        <span className="toggle-slider" />
      </span>
    </label>
  );
};
