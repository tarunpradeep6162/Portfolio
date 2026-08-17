import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useConsultationStore } from "../stores/consultationStore";

interface BookingScreenProps {
  navigation: any;
}

export default function BookingScreen({ navigation }: BookingScreenProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const bookConsultation = useConsultationStore(
    (state) => state.bookConsultation
  );

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !title || !description) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await bookConsultation({
        title,
        description,
        date: selectedDate,
        time: selectedTime,
        duration: 60,
        consultant: { name: "Tarun Pradeep", title: "Senior Consultant" },
        status: "pending",
      });

      Alert.alert("Success", "Consultation booked successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to book consultation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic</Text>
        <TextInput
          style={styles.input}
          placeholder="What is this consultation about?"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 100 }]}
          placeholder="Tell us more about what you need"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            // TODO: Show date picker
          }}
        >
          <Text style={{ color: selectedDate ? "#333" : "#999" }}>
            {selectedDate || "Select a date"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Time</Text>
        <View style={styles.timeGrid}>
          {["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"].map(
            (time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.timeSlotTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.bookButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleBook}
          disabled={loading}
        >
          <Text style={styles.bookButtonText}>
            {loading ? "Booking..." : "Book Consultation"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    backgroundColor: "white",
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    flex: 1,
    minWidth: "30%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  timeSlotSelected: {
    backgroundColor: "#0066cc",
    borderColor: "#0066cc",
  },
  timeSlotText: {
    color: "#333",
    fontWeight: "500",
    fontSize: 12,
  },
  timeSlotTextSelected: {
    color: "white",
  },
  bookButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  bookButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
