export type Invitation = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "declined";
  threadId?: string;
};

export const invitations: Map<string, Invitation> = new Map();
