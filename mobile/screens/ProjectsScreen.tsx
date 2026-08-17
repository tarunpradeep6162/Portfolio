import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const DEMO_PROJECTS = [
  {
    id: "p1",
    name: "Kubernetes Migration",
    status: "active",
    progress: 65,
    team: "3 members",
  },
  {
    id: "p2",
    name: "AWS Infrastructure",
    status: "planning",
    progress: 20,
    team: "2 members",
  },
];

interface ProjectsScreenProps {
  navigation: any;
}

export default function ProjectsScreen({ navigation }: ProjectsScreenProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Projects</Text>
      </View>

      <View style={styles.listContainer}>
        {DEMO_PROJECTS.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={styles.projectCard}
            onPress={() =>
              navigation.navigate("ProjectDetail", { id: project.id })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      project.status === "active"
                        ? "#4CAF50"
                        : "#FFC107",
                  },
                ]}
              >
                <Text style={styles.statusText}>{project.status}</Text>
              </View>
            </View>

            <Text style={styles.team}>{project.team}</Text>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${project.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>{project.progress}%</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  team: {
    color: "#666",
    fontSize: 12,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
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
});
