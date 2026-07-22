import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ProxyConfig } from '../types/settings';
import type { ProxyTestResult } from '../types/ai';

interface ScreenInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowPos {
  x: number;
  y: number;
  width: number;
  height: number;
  screenWidth: number;
}

export const electronIpc = {
  isElectron: (): boolean => typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window),

  startDrag: (_screenX?: number, _screenY?: number): void => {
    invoke('start_drag').catch(() => {});
  },

  moveWindow: (_deltaXOrScreenX?: number, _deltaYOrScreenY?: number, _isAbsolute = false): void => {
    invoke('move_window').catch(() => {});
  },

  endDrag: (): void => {
    invoke('end_drag').catch(() => {});
  },

  getWindowPosition: async (): Promise<WindowPos | null> => {
    return invoke<WindowPos>('get_window_position').catch(() => null);
  },

  getRelativeCursorPos: async (): Promise<{ clientX: number; clientY: number } | null> => {
    return invoke<{ clientX: number; clientY: number }>('get_relative_cursor_pos').catch(() => null);
  },

  wanderMove: (deltaX: number, deltaY: number): void => {
    invoke('wander_move', { deltaX, deltaY }).catch(() => {});
  },

  setWindowPos: async (x: number, y: number): Promise<void> => {
    await invoke('set_window_pos', { x, y }).catch(() => {});
  },

  getScreenInfo: async (): Promise<ScreenInfo | null> => {
    return invoke<ScreenInfo>('get_screen_info').catch(() => null);
  },

  showLauncher: async (): Promise<void> => {
    await invoke('show_launcher').catch(() => {});
  },

  showPet: async (): Promise<void> => {
    await invoke('show_pet').catch(() => {});
  },

  resizePetWindow: (scale: number): void => {
    invoke('resize_pet_window', { scale }).catch(() => {});
  },

  minimizeWindow: (): void => {
    invoke('minimize_window').catch(() => {});
  },

  closeWindow: (): void => {
    invoke('close_window').catch(() => {});
  },

  setAlwaysOnTop: (val: boolean): void => {
    invoke('set_always_on_top', { value: val }).catch(() => {});
  },

  sendProxyConfig: (_cfg: ProxyConfig): void => {
    // Proxy configuration is passed directly during testProxy in Tauri backend
  },

  testProxy: async (cfg: ProxyConfig): Promise<ProxyTestResult> => {
    return invoke<ProxyTestResult>('test_proxy', { cfg }).catch((err) => ({
      ok: false,
      error: String(err),
    }));
  },

  onCursorMove: (callback: (pos: { clientX: number; clientY: number }) => void): (() => void) => {
    let unlisten: (() => void) | null = null;
    listen<{ clientX: number; clientY: number }>('cursor-move', (event) => {
      callback(event.payload);
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      if (unlisten) unlisten();
    };
  },

  onWindowVisibilityChange: (onHidden: () => void, onVisible: () => void): (() => void) => {
    let unlistenHidden: (() => void) | null = null;
    let unlistenVisible: (() => void) | null = null;

    listen('window-hidden', () => onHidden())
      .then((fn) => {
        unlistenHidden = fn;
      })
      .catch(() => {});

    listen('window-visible', () => onVisible())
      .then((fn) => {
        unlistenVisible = fn;
      })
      .catch(() => {});

    return () => {
      if (unlistenHidden) unlistenHidden();
      if (unlistenVisible) unlistenVisible();
    };
  },
};

export const appIpc = electronIpc;
