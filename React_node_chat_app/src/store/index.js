
import { create } from "zustand";
import { createAuthSlice } from "./slices/auth-slice";
import { createChatSlice } from "./slices/chat-slice";

/**
 * Zustand global store for app state management
 * Combines auth and chat slices
 */
export const useAppStore = create((...a) => ({
    ...createAuthSlice(...a),
    ...createChatSlice(...a),
}));
