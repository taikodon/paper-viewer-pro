import { load, Store } from '@tauri-apps/plugin-store';
import type { AppState } from '../types';

let storeInstance: Store | null = null;

async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load('app-state.json', {
      defaults: {
        windowWidth: 1280,
        windowHeight: 800,
        windowX: 0,
        windowY: 0,
        lastPaperId: null,
        geminiApiKey: '',
      },
    });
  }
  return storeInstance;
}

const DEFAULTS: AppState = {
  windowWidth: 1280,
  windowHeight: 800,
  windowX: 0,
  windowY: 0,
  lastPaperId: null,
  geminiApiKey: '',
};

export const storeService = {
  async get<K extends keyof AppState>(key: K): Promise<AppState[K]> {
    const store = await getStore();
    const value = await store.get<AppState[K]>(key);
    return value ?? DEFAULTS[key];
  },

  async set<K extends keyof AppState>(key: K, value: AppState[K]): Promise<void> {
    const store = await getStore();
    await store.set(key, value);
    await store.save();
  },

  async getApiKey(): Promise<string> {
    return this.get('geminiApiKey');
  },

  async setApiKey(key: string): Promise<void> {
    return this.set('geminiApiKey', key);
  },

  async getLastPaperId(): Promise<number | null> {
    return this.get('lastPaperId');
  },

  async setLastPaperId(id: number | null): Promise<void> {
    return this.set('lastPaperId', id);
  },
};
