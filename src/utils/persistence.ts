type StorageLike = Pick<
  Storage,
  'setItem' | 'getItem' | 'removeItem' | 'clear'
>;

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>();
  return {
    setItem: (key, value) => {
      store.set(key, value);
    },
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

const storage: StorageLike =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
    : createMemoryStorage();

type Persistence = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
};

export const persistence: Persistence = {
  async setItem(key, value) {
    storage.setItem(key, value);
  },
  async getItem(key) {
    return storage.getItem(key);
  },
  async removeItem(key) {
    storage.removeItem(key);
  },
  async clear() {
    storage.clear();
  },
};
