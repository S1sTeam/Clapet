import React, { useState } from 'react';
import type { AppSettings } from '../../types/settings';
import { AI_PROVIDERS, aiService } from '../../services/aiProviders';
import { CustomSelect, type SelectOption } from '../common/CustomSelect';
import { EyeIcon } from '../common/Icons';

interface TabAISettingsProps {
  settings: AppSettings;
  onUpdateSettings: (updater: Partial<AppSettings>) => void;
}

export const TabAISettings: React.FC<TabAISettingsProps> = ({ settings, onUpdateSettings }) => {
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const providerOptions: SelectOption[] = Object.values(AI_PROVIDERS).map(p => ({
    value: p.id,
    label: p.name,
  }));

  const handleProviderChange = (providerId: string) => {
    const prov = AI_PROVIDERS[providerId];
    onUpdateSettings({
      provider: providerId,
      selectedModel: prov?.defaultModel || '',
      customUrl: prov?.defaultUrl || '',
    });
    setVerifyStatus(null);
  };

  const handleVerifyKey = async () => {
    setVerifying(true);
    setVerifyStatus(null);
    const result = await aiService.verifyKey(settings.provider, settings.apiKey, settings.customUrl);
    setVerifying(false);

    if (result.ok) {
      setVerifyStatus({ ok: true, msg: 'Ключ валиден!' });
      if (result.models && result.models.length > 0) {
        setAvailableModels(result.models);
        if (!settings.selectedModel || !result.models.includes(settings.selectedModel)) {
          onUpdateSettings({ selectedModel: result.models[0] });
        }
      }
    } else {
      setVerifyStatus({ ok: false, msg: result.error || 'Ошибка проверки' });
    }
  };

  return (
    <section id="tab-ai" className="tab-content active">
      <h2>AI</h2>
      <div className="card elevation-2">
        <div className="setting-row">
          <label>Провайдер</label>
          <CustomSelect
            options={providerOptions}
            value={settings.provider}
            onChange={handleProviderChange}
            id="launcher-provider-select"
          />
        </div>

        {settings.provider === 'custom' && (
          <div className="setting-row">
            <label>Base URL</label>
            <div className="key-row">
              <input
                type="text"
                value={settings.customUrl}
                onChange={e => onUpdateSettings({ customUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
              />
            </div>
          </div>
        )}

        <div className="setting-row">
          <label>API Key</label>
          <div className="key-row">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={e => onUpdateSettings({ apiKey: e.target.value })}
              placeholder="sk-..."
            />
            <button type="button" onClick={() => setShowKey(!showKey)}>
              <EyeIcon size={14} />
            </button>
          </div>
        </div>

        <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <button id="launcher-verify-btn" className="btn" onClick={handleVerifyKey} disabled={verifying}>
            {verifying ? 'Проверка...' : 'Проверить'}
          </button>
          {verifyStatus && (
            <span style={{ color: verifyStatus.ok ? '#b8bb26' : '#fb4934', fontSize: 12 }}>
              {verifyStatus.msg}
            </span>
          )}
        </div>

        {(availableModels.length > 0 || settings.provider !== 'custom') && (
          <div className="setting-row">
            <label>Модель</label>
            {availableModels.length > 0 ? (
              <CustomSelect
                options={availableModels.map(m => ({ value: m, label: m }))}
                value={settings.selectedModel}
                onChange={val => onUpdateSettings({ selectedModel: val })}
              />
            ) : (
              <input
                type="text"
                value={settings.selectedModel}
                onChange={e => onUpdateSettings({ selectedModel: e.target.value })}
                placeholder="Введите имя модели"
                style={{ width: '100%' }}
              />
            )}
          </div>
        )}

        <div
          className="setting-row"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 12,
            marginTop: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: verifyStatus?.ok ? '#b8bb26' : '#a89984',
                flexShrink: 0,
              }}
            />
            <span style={{ color: verifyStatus?.ok ? '#b8bb26' : '#a89984', fontSize: 11 }}>
              {verifyStatus?.ok ? 'Настроен' : 'Не настроен'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
