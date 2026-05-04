import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  squads: [],
  setSquads: (squads) => set({ squads }),

  players: [],
  setPlayers: (players) => set({ players }),

  selectedPlayers: [],
  setSelectedPlayers: (players) => set({ selectedPlayers: players }),

  captain: null,
  setCaptain: (captain) => set({ captain }),

  loading: false,
  setLoading: (loading) => set({ loading }),

  error: null,
  setError: (error) => set({ error })
}));
