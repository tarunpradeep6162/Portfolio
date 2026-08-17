import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Consultation {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  consultant: {
    name: string;
    avatar?: string;
    title: string;
  };
  status: "scheduled" | "completed" | "cancelled" | "pending";
  meetingLink?: string;
  notes?: string;
}

interface ConsultationState {
  consultations: Consultation[];
  selectedConsultation: Consultation | null;
  loading: boolean;
  error: string | null;

  fetchConsultations: () => Promise<void>;
  selectConsultation: (id: string) => void;
  bookConsultation: (consultation: Omit<Consultation, "id">) => Promise<void>;
  cancelConsultation: (id: string) => Promise<void>;
  addNote: (id: string, note: string) => Promise<void>;
}

export const useConsultationStore = create<ConsultationState>((set, get) => ({
  consultations: [],
  selectedConsultation: null,
  loading: false,
  error: null,

  fetchConsultations: async () => {
    set({ loading: true, error: null });

    try {
      // TODO: Call API endpoint /api/consultations
      const response = await fetch("http://localhost:3000/api/consultations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch consultations");
      }

      const data = await response.json();

      await AsyncStorage.setItem(
        "consultations",
        JSON.stringify(data.consultations)
      );

      set({ consultations: data.consultations, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
    }
  },

  selectConsultation: (id: string) => {
    const consultation = get().consultations.find((c) => c.id === id);
    set({ selectedConsultation: consultation || null });
  },

  bookConsultation: async (consultation: Omit<Consultation, "id">) => {
    set({ loading: true, error: null });

    try {
      // TODO: Call API endpoint /api/consultations/book
      const response = await fetch("http://localhost:3000/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(consultation),
      });

      if (!response.ok) {
        throw new Error("Failed to book consultation");
      }

      const newConsultation = await response.json();

      const updatedConsultations = [
        ...get().consultations,
        newConsultation,
      ];

      await AsyncStorage.setItem(
        "consultations",
        JSON.stringify(updatedConsultations)
      );

      set({
        consultations: updatedConsultations,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
      throw error;
    }
  },

  cancelConsultation: async (id: string) => {
    set({ loading: true, error: null });

    try {
      // TODO: Call API endpoint /api/consultations/:id/cancel
      const response = await fetch(
        `http://localhost:3000/api/consultations/${id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel consultation");
      }

      const updatedConsultations = get().consultations.map((c) =>
        c.id === id ? { ...c, status: "cancelled" as const } : c
      );

      await AsyncStorage.setItem(
        "consultations",
        JSON.stringify(updatedConsultations)
      );

      set({
        consultations: updatedConsultations,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
      throw error;
    }
  },

  addNote: async (id: string, note: string) => {
    set({ loading: true, error: null });

    try {
      // TODO: Call API endpoint /api/consultations/:id/notes
      const response = await fetch(
        `http://localhost:3000/api/consultations/${id}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ note }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      const updatedConsultations = get().consultations.map((c) =>
        c.id === id ? { ...c, notes: note } : c
      );

      await AsyncStorage.setItem(
        "consultations",
        JSON.stringify(updatedConsultations)
      );

      set({
        consultations: updatedConsultations,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
      });
      throw error;
    }
  },
}));
