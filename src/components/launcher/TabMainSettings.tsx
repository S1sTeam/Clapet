import React, { useState } from 'react';
import type { AppSettings } from '../../types/settings';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { RangeSlider } from '../common/RangeSlider';
import { ColorPicker } from '../common/ColorPicker';
import { CustomSelect } from '../common/CustomSelect';
import { electronIpc } from '../../services/electronIpc';

interface TabMainSettingsProps {
  settings: AppSettings;
  onUpdateSettings: (updater: Partial<AppSettings>) => void;
  onResetSettings: () => void;
}

const ACCENT_COLORS = [
  { color: '#FF8A8A', title: 'Красный' },
  { color: '#FFB882', title: 'Оранжевый' },
  { color: '#FFE082', title: 'Жёлтый' },
  { color: '#C5E099', title: 'Лайм' },
  { color: '#8FDBA8', title: 'Зелёный' },
  { color: '#8FD6E0', title: 'Голубой' },
  { color: '#8AB8FF', title: 'Синий' },
  { color: '#B8A8FF', title: 'Фиолетовый' },
  { color: '#FFA8D8', title: 'Розовый' },
];

export const TabMainSettings: React.FC<TabMainSettingsProps> = ({ settings, onUpdateSettings, onResetSettings }) => {
  const [proxyTesting, setProxyTesting] = useState(false);
  const [proxyStatus, setProxyStatus] = useState<string | null>(null);

  const handleProxyTest = async () => {
    setProxyTesting(true);
    setProxyStatus('Тестирование...');
    const result = await electronIpc.testProxy(settings.proxy);
    setProxyTesting(false);
    if (result.ok) {
      setProxyStatus(`Успех (${result.ms}ms)`);
    } else {
      setProxyStatus(`Ошибка: ${result.error || 'Не удалось подключиться'}`);
    }
  };

  return (
    <section id="tab-main-settings" className="tab-content active">
      <h2>Настройки</h2>
      <div className="card elevation-2">
        <div className="setting-row">
          <ToggleSwitch
            label="Автозапуск питомца"
            checked={settings.autoLaunch}
            onChange={val => onUpdateSettings({ autoLaunch: val })}
          />
        </div>

        <div className="setting-row">
          <ToggleSwitch
            label="Поверх всех окон"
            checked={settings.alwaysOnTop}
            onChange={val => onUpdateSettings({ alwaysOnTop: val })}
          />
        </div>

        <div className="setting-row">
          <ToggleSwitch
            label="Показывать частицы"
            checked={settings.showParticles}
            onChange={val => onUpdateSettings({ showParticles: val })}
          />
        </div>

        <div className="setting-row">
          <ToggleSwitch
            label="Плавающие буквы"
            checked={settings.floatLetters}
            onChange={val => onUpdateSettings({ floatLetters: val })}
          />
        </div>

        <RangeSlider
          label="Размер шрифта"
          min={10}
          max={18}
          step={1}
          value={settings.fontSize}
          unit="px"
          onChange={val => onUpdateSettings({ fontSize: val })}
        />

        <ColorPicker
          label="Акцентный цвет"
          value={settings.accentColor}
          options={ACCENT_COLORS}
          onChange={color => onUpdateSettings({ accentColor: color })}
        />

        <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          <ToggleSwitch
            label="Прокси"
            checked={settings.proxy.enabled}
            onChange={val =>
              onUpdateSettings({
                proxy: { ...settings.proxy, enabled: val },
              })
            }
          />

          {settings.proxy.enabled && (
            <div id="proxy-details" style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <CustomSelect
                  options={[
                    { value: 'http', label: 'HTTP' },
                    { value: 'https', label: 'HTTPS' },
                    { value: 'socks5', label: 'SOCKS5' },
                  ]}
                  value={settings.proxy.protocol}
                  onChange={val =>
                    onUpdateSettings({
                      proxy: { ...settings.proxy, protocol: val as any },
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Хост"
                  value={settings.proxy.host}
                  onChange={e =>
                    onUpdateSettings({
                      proxy: { ...settings.proxy, host: e.target.value },
                    })
                  }
                  style={{
                    flex: 1,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 6px',
                    font: 'inherit',
                    fontSize: 11,
                    color: 'var(--fg)',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <input
                  type="text"
                  placeholder="Порт"
                  value={settings.proxy.port}
                  onChange={e =>
                    onUpdateSettings({
                      proxy: { ...settings.proxy, port: e.target.value },
                    })
                  }
                  style={{
                    flex: '0 0 70px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 6px',
                    font: 'inherit',
                    fontSize: 11,
                    color: 'var(--fg)',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="text"
                  placeholder="Логин (опц.)"
                  value={settings.proxy.username || ''}
                  onChange={e =>
                    onUpdateSettings({
                      proxy: { ...settings.proxy, username: e.target.value },
                    })
                  }
                  style={{
                    flex: 1,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 6px',
                    font: 'inherit',
                    fontSize: 11,
                    color: 'var(--fg)',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
                <input
                  type="password"
                  placeholder="Пароль (опц.)"
                  value={settings.proxy.password || ''}
                  onChange={e =>
                    onUpdateSettings({
                      proxy: { ...settings.proxy, password: e.target.value },
                    })
                  }
                  style={{
                    flex: 1,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 6px',
                    font: 'inherit',
                    fontSize: 11,
                    color: 'var(--fg)',
                    outline: 'none',
                    minWidth: 0,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className="btn"
                  onClick={handleProxyTest}
                  disabled={proxyTesting}
                  style={{ fontSize: 11, padding: '3px 10px' }}
                >
                  {proxyTesting ? 'Тест...' : 'Тест'}
                </button>
                {proxyStatus && <span style={{ fontSize: 10, color: 'var(--fg-dim)' }}>{proxyStatus}</span>}
              </div>
            </div>
          )}
        </div>

        <button className="btn" onClick={onResetSettings} style={{ marginTop: 8 }}>
          Сбросить все настройки
        </button>
      </div>
    </section>
  );
};
