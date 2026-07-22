import React from 'react';
import type { AppSettings } from '../../types/settings';
import type { PetStats } from '../../types/pet';
import { RangeSlider } from '../common/RangeSlider';
import { ColorPicker } from '../common/ColorPicker';
import { ToggleSwitch } from '../common/ToggleSwitch';

interface TabPetSettingsProps {
  settings: AppSettings;
  stats: PetStats;
  onUpdateSettings: (updater: Partial<AppSettings>) => void;
}

const PET_COLORS = [
  { color: '#df7959', title: 'Оранжевый' },
  { color: '#fbf1c7', title: 'Кремовый' },
  { color: '#fe8019', title: 'Оранжевый яркий' },
  { color: '#b8bb26', title: 'Зелёный' },
  { color: '#83a598', title: 'Голубой' },
  { color: '#d3869b', title: 'Розовый' },
];

export const TabPetSettings: React.FC<TabPetSettingsProps> = ({ settings, stats, onUpdateSettings }) => {
  const feedCooldownLeft = Math.max(0, Math.ceil((30 * 60 * 1000 - (Date.now() - stats.lastFeed)) / 1000));
  const feedCooldownText =
    feedCooldownLeft === 0
      ? 'Готов к корму'
      : `${Math.floor(feedCooldownLeft / 60)}м ${feedCooldownLeft % 60}с`;

  return (
    <section id="tab-pet-settings" className="tab-content active">
      <h2>Питомец</h2>
      <div className="card elevation-2">
        <RangeSlider
          label="Скорость дыхания"
          min={0.5}
          max={6}
          step={0.1}
          value={settings.breathSpeed}
          onChange={val => onUpdateSettings({ breathSpeed: val })}
        />

        <RangeSlider
          label="Амплитуда дыхания"
          min={1}
          max={15}
          step={1}
          value={settings.breathAmplitude}
          onChange={val => onUpdateSettings({ breathAmplitude: val })}
        />

        <RangeSlider
          label="Скорость ходьбы"
          min={0.2}
          max={3}
          step={0.1}
          value={settings.walkSpeed}
          onChange={val => onUpdateSettings({ walkSpeed: val })}
        />

        <ColorPicker
          label="Цвет питомца"
          value={settings.petColor}
          options={PET_COLORS}
          onChange={color => onUpdateSettings({ petColor: color })}
        />

        <div className="setting-row">
          <ToggleSwitch
            label="Автоматические мысли"
            checked={settings.autoThink}
            onChange={val => onUpdateSettings({ autoThink: val })}
          />
        </div>

        <div className="setting-row">
          <ToggleSwitch
            label="Автоматическая ходьба"
            checked={settings.autoWalk}
            onChange={val => onUpdateSettings({ autoWalk: val })}
          />
        </div>

        <div className="setting-row">
          <ToggleSwitch
            label="Озвучка ответов (TTS)"
            checked={settings.ttsEnabled}
            onChange={val => onUpdateSettings({ ttsEnabled: val })}
          />
        </div>

        <RangeSlider
          label="Прозрачность питомца"
          min={0.2}
          max={1}
          step={0.05}
          value={settings.petOpacity}
          unit="%"
          onChange={val => onUpdateSettings({ petOpacity: val })}
        />

        <div className="stat-card">
          <h3>Статистика</h3>
          <div className="stat-row">
            <span>Уровень</span>
            <span>{stats.level}</span>
          </div>
          <div className="stat-row">
            <span>Опыт</span>
            <span>
              {stats.xp} / {stats.maxXp}
            </span>
          </div>
          <div className="stat-row">
            <span>Съедено печенья</span>
            <span>{stats.cookies}</span>
          </div>
          <div className="stat-row">
            <span>До кормёжки</span>
            <span>{feedCooldownText}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
