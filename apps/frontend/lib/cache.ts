// Client-side cache stub
export const cache = {
  get: async (key: string) => null,
  set: async (key: string, value: any, ttl?: number) => {},
  delete: async (key: string) => {},
  clear: async () => {},
};

export const getCached = async <T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> => {
  return fetcher();
};

