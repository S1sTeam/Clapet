import type { AIProviderConfig, VerifyKeyResult } from '../types/ai';

export const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o1-mini'],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    defaultUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'auto',
    models: ['auto', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini', 'google/gemini-2.0-flash-exp:free'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Claude',
    defaultUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-haiku-latest',
    models: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest'],
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.0-flash-exp',
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    defaultUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-small-latest',
    models: ['mistral-small-latest', 'mistral-large-latest', 'open-mixtral-8x22b'],
  },
  together: {
    id: 'together',
    name: 'Together AI',
    defaultUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    defaultUrl: 'https://api.perplexity.ai',
    defaultModel: 'sonar',
    models: ['sonar', 'sonar-pro', 'sonar-reasoning'],
  },
  xai: {
    id: 'xai',
    name: 'xAI (Grok)',
    defaultUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-beta',
    models: ['grok-beta', 'grok-vision-beta'],
  },
  github: {
    id: 'github',
    name: 'GitHub Models',
    defaultUrl: 'https://models.inference.ai.azure.com',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'Phi-3-medium-instruct'],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    defaultUrl: '',
    defaultModel: '',
    models: [],
  },
};

export const aiService = {
  getBaseUrl(providerId: string, customUrl?: string): string {
    if (providerId === 'custom') return customUrl || '';
    return AI_PROVIDERS[providerId]?.defaultUrl || '';
  },

  async verifyKey(providerId: string, apiKey: string, customUrl?: string): Promise<VerifyKeyResult> {
    if (!apiKey) return { ok: false, error: 'Введите API ключ' };
    const baseUrl = this.getBaseUrl(providerId, customUrl).replace(/\/+$/, '');
    if (!baseUrl) return { ok: false, error: 'Укажите Base URL' };

    try {
      if (providerId === 'anthropic') {
        const res = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: AI_PROVIDERS.anthropic.defaultModel,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });
        if (res.ok || res.status === 400) {
          return { ok: true, models: AI_PROVIDERS.anthropic.models };
        }
        const errJson = await res.json().catch(() => ({}));
        return { ok: false, error: errJson.error?.message || `Ошибка: ${res.status}` };
      }

      // OpenAI-compatible endpoint for models check
      const modelsUrl = `${baseUrl}/models`;
      const res = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (res.ok) {
        const data = await res.json();
        const fetchedModels: string[] = Array.isArray(data.data)
          ? data.data.map((m: any) => m.id).filter(Boolean)
          : [];
        const combined = Array.from(new Set([...(AI_PROVIDERS[providerId]?.models || []), ...fetchedModels]));
        return { ok: true, models: combined.length ? combined : AI_PROVIDERS[providerId]?.models };
      }

      // Fallback request
      const compRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_PROVIDERS[providerId]?.defaultModel || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      });

      if (compRes.ok || compRes.status === 400) {
        return { ok: true, models: AI_PROVIDERS[providerId]?.models || [] };
      }
      return { ok: false, error: `Ошибка API (${compRes.status})` };
    } catch (err: any) {
      return { ok: false, error: err.message || 'Ошибка сети' };
    }
  },

  async askAI(prompt: string, providerId: string, apiKey: string, model: string, customUrl?: string): Promise<string> {
    const baseUrl = this.getBaseUrl(providerId, customUrl).replace(/\/+$/, '');
    const selectedModel = model || AI_PROVIDERS[providerId]?.defaultModel || 'gpt-4o-mini';

    const systemPrompt = `Ты — Клапет (Clapet), маленкое милое пиксельное домашнее животное (desktop pet). Разговаривай дружелюбно, лаконично и мило на русском языке. Твои ответы должны быть короткими (1-3 предложения).`;

    if (providerId === 'anthropic') {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 150,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Ошибка Anthropic API');
      return data.content?.[0]?.text || 'Мяу!';
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Ошибка API (${res.status})`);
    return data.choices?.[0]?.message?.content || 'Гав!';
  },
};
