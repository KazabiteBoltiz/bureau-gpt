export interface Chat {
  id: string;
  title: string;
  essay: string;
  keywords: [string?];
  isLocked?: boolean;
  password?: string;
}

export interface ChatState {
  chats: Chat[];
  activeChat: string | null;
}