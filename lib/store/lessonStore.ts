
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LessonSessionState {
    currentStep: number;
    totalSteps: number;
    history: string[]; // Step IDs or logs
    retries: number;
    isGenerating: boolean;

    // Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    addHistory: (log: string) => void;
    setGenerating: (status: boolean) => void;
    resetSession: () => void;
}

export const useLessonStore = create<LessonSessionState>()(
    persist(
        (set) => ({
            currentStep: 0,
            totalSteps: 5, // Default
            history: [],
            retries: 0,
            isGenerating: false,

            setStep: (step) => set({ currentStep: step }),
            nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1) })),
            prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
            addHistory: (log) => set((state) => ({ history: [...state.history, log] })),
            setGenerating: (status) => set({ isGenerating: status }),
            resetSession: () => set({ currentStep: 0, history: [], retries: 0, isGenerating: false })
        }),
        {
            name: 'lesson-session-storage', // key in localStorage
        }
    )
);
