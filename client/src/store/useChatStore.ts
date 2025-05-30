import { create } from 'zustand';
import { useAuthStore, AuthUser } from './userAuthStore';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  image: string;
  createdAt: string;
};

type MessageData = {
  text: string;
};

type chatStoreData = {
  messages: Message[];
  users: AuthUser[];
  selectedUser: AuthUser | null;
  isUserLoading: boolean;
  isMessageLoading: boolean;

  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: MessageData) => Promise<void>;
  subscribeToMessages: () => void;
  unSubscribeToMessages: () => void;
  setSelectedUser: (user: AuthUser | null) => void;
};

export const useChatStore = create<chatStoreData>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessageLoading: false,

  getUsers: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get<AuthUser[]>('/users');
      set({ users: res.data });
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUserLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessageLoading: true });
    try {
      const res = await axiosInstance.get<Message[]>(`/${userId}`);

      console.log('Fetching messages for user:', userId);

      set({ messages: res.data });
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessageLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.post(
        `/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessageLoading: false });
    }
  },
  subscribeToMessages: async () => {

    

    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket?.on('newMessage', (newMessage) => {
      const { selectedUser, messages } = get();

      if (!selectedUser) return;

      const isFromCurrentChat = newMessage.senderId === selectedUser._id;

      if (isFromCurrentChat) {
        set({ messages: [...messages, newMessage] });
      }
    });
    
  },
  unSubscribeToMessages: async () => {
    const socket = useAuthStore.getState().socket;
    if (socket?.off) {
      //@ts-ignore
      socket.off('newMessage');
    }
  },

  setSelectedUser: async (user) => {
    set({ selectedUser: user });
    if (!user) return;
    get().getMessages(user._id);

  },
}));
