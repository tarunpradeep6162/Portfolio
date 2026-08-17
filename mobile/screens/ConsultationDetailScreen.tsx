import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useConsultationStore } from "../stores/consultationStore";

interface ConsultationDetailScreenProps {
  route: { params: { id: string } };
  navigation: any;
}

export default function ConsultationDetailScreen({
  route,
  navigation,
}: ConsultationDetailScreenProps) {
  const consultations = useConsultationStore((state) => state.consultations);
  const consultation = consultations.find((c) => c.id === route.params.id);

  if (!consultation) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Consultation not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{consultation.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: "#4CAF50" }]}>
          <Text style={styles.statusText}>{consultation.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Consultant</Text>
          <Text style={styles.value}>{consultation.consultant.name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date & Time</Text>
          <Text style={styles.value}>
            {consultation.date} at {consultation.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{consultation.duration} minutes</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{consultation.description}</Text>
      </View>

      {consultation.meetingLink && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📹 Join Meeting</Text>
          </TouchableOpacity>
        </View>
      )}

      {consultation.status === "scheduled" && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Cancel Consultation</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "capitalize",
  },
  section: {
    backgroundColor: "white",
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: "#0066cc",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: "#f44336",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
