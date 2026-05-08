export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  consumers: {
    all: ['consumers'] as const,
    list: (skip: number, limit: number) => ['consumers', skip, limit] as const,
  },
  personas: {
    all: ['personas'] as const,
  },
};
