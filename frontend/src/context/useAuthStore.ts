import { create } from 'zustand';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'Admin' | 'Document_Clerk' | 'Official' | 'Private_Citizen';
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  updateActivity: () => void;
  updateProfile: (updatedFields: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('elts_user') || 'null'),
  token: localStorage.getItem('elts_token'),
  isAuthenticated: !!localStorage.getItem('elts_token'),
  lastActivity: Date.now(),

  // Run upon validation success from backend login api
  login: (user, token) => {
    localStorage.setItem('elts_token', token);
    localStorage.setItem('elts_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, lastActivity: Date.now() });
  },

  // Flashes state parameters and handles idle boot clear actions
  logout: () => {
    localStorage.removeItem('elts_token');
    localStorage.removeItem('elts_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Refreshes client-side tracking vectors on critical mouse/navigation bindings
  updateActivity: () => set({ lastActivity: Date.now() }),

  // Allows Document Clerks and Admin to update their structural name/email states instantly
  updateProfile: (updatedFields) => set((state) => {
    if (!state.user) return {};
    const newUser = { ...state.user, ...updatedFields };
    localStorage.setItem('elts_user', JSON.stringify(newUser));
    return { user: newUser };
  })
}));
