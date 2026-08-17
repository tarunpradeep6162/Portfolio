import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface ProjectDetailScreenProps {
  route: { params: { id: string } };
}

export default function ProjectDetailScreen({
  route,
}: ProjectDetailScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Kubernetes Migration</Text>
        <Text style={styles.subtitle}>
          Complete migration to Kubernetes infrastructure
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: "#4CAF50" }]}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "65%" }]} />
        </View>
        <Text style={styles.progressPercent}>65% Complete</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timelineItem}>
          <Text style={styles.label}>Start Date</Text>
          <Text style={styles.value}>August 1, 2024</Text>
        </View>
        <View style={styles.timelineItem}>
          <Text style={styles.label}>End Date</Text>
          <Text style={styles.value}>October 15, 2024</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.label}>Budget</Text>
          <Text style={styles.value}>$15,000</Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={styles.label}>Spent</Text>
          <Text style={[styles.value, { color: "#FF9800" }]}>$9,750</Text>
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "capitalize",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0066cc",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  timelineItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#999",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
});
