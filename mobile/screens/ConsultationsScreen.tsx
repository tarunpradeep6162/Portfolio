import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useConsultationStore } from "../stores/consultationStore";

interface ConsultationsScreenProps {
  navigation: any;
}

export default function ConsultationsScreen({
  navigation,
}: ConsultationsScreenProps) {
  const consultations = useConsultationStore((state) => state.consultations);
  const loading = useConsultationStore((state) => state.loading);
  const fetchConsultations = useConsultationStore(
    (state) => state.fetchConsultations
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchConsultations();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Consultations</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Booking")}
          style={styles.bookButton}
        >
          <Text style={styles.bookButtonText}>+ Book New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 20 }} />
      ) : consultations.length > 0 ? (
        <View style={styles.listContainer}>
          {consultations.map((consultation) => (
            <TouchableOpacity
              key={consultation.id}
              onPress={() =>
                navigation.navigate("ConsultationDetail", {
                  id: consultation.id,
                })
              }
              style={[
                styles.consultationCard,
                {
                  borderLeftColor:
                    consultation.status === "scheduled"
                      ? "#4CAF50"
                      : consultation.status === "completed"
                        ? "#2196F3"
                        : "#ccc",
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{consultation.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        consultation.status === "scheduled"
                          ? "#4CAF50"
                          : consultation.status === "completed"
                            ? "#2196F3"
                            : "#999",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {consultation.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.consultant}>
                {consultation.consultant.name}
              </Text>
              <Text style={styles.datetime}>
                {consultation.date} • {consultation.time}
              </Text>
              {consultation.meetingLink && (
                <TouchableOpacity style={styles.linkButton}>
                  <Text style={styles.linkButtonText}>Join Meeting</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No consultations yet</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Booking")}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Book Your First Consultation</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  bookButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bookButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
  },
  consultationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  consultant: {
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
  },
  datetime: {
    color: "#999",
    fontSize: 12,
    marginBottom: 12,
  },
  linkButton: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  linkButtonText: {
    color: "#0066cc",
    fontWeight: "600",
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
