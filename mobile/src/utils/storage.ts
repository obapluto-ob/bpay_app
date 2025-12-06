class StorageService {
  private storage: { [key: string]: string } = {};

  async getItem(key: string): Promise<string | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return this.storage[key] || null;
    } catch {
      return this.storage[key] || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      this.storage[key] = value;
    } catch {
      this.storage[key] = value;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete this.storage[key];
    } catch {
      delete this.storage[key];
    }
  }
}

export const storage = new StorageService();