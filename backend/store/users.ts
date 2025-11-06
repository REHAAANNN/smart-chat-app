// backend/store/users.ts
export type User = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  socketId?: string;
  online: boolean;
};

export const users: Record<string, User> = {};
