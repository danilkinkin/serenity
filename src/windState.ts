import { create } from 'zustand'

interface WindState {
  variant: 'calm' | 'force'
  calm: {
    force: number
    calm: number
    speed: number
    scale: number
  }
  force: {
    force: number
    calm: number
    speed: number
    scale: number
  }
  forceWind: () => void
  calmWind: () => void
}

export const useWindStore = create<WindState>((set) => ({
  variant: 'calm',
  calm: {
    force: 10,
    calm: 4,
    speed: 2,
    scale: 70,
  },
  force: {
    force: 220,
    calm: 4,
    speed: 50,
    scale: 70,
  },
  forceWind: () =>
    set({
      variant: 'force',
    }),
  calmWind: () =>
    set({
      variant: 'calm',
    }),
}))
