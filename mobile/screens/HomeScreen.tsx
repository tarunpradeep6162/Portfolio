import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../stores/authStore";
import { useConsultationStore } from "../stores/consultationStore";

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const user = useAuthStore((state) => state.user);
  const consultations = useConsultationStore((state) => state.consultations);
  const fetchConsultations = useConsultationStore(
    (state) => state.fetchConsultations
  );
  const loading = useConsultationStore((state) => state.loading);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const upcomingConsultations = consultations.filter(
    (c) => c.status === "scheduled"
  );
  const completedConsultations = consultations.filter(
    (c) => c.status === "completed"
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#0066cc",
          padding: 20,
          paddingTop: 40,
          paddingBottom: 30,
        }}
      >
        <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
          Welcome, {user?.name}!
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
          Manage your consultations and projects
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Quick Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <StatCard
            title="Upcoming"
            value={upcomingConsultations.length}
            color="#4CAF50"
          />
          <StatCard
            title="Completed"
            value={completedConsultations.length}
            color="#2196F3"
          />
          <StatCard title="Projects" value="2" color="#FF9800" />
        </View>

        {/* Upcoming Consultations */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
              Upcoming Consultations
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ConsultationsTab")}
            >
              <Text style={{ color: "#0066cc", fontWeight: "600" }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0066cc" />
          ) : upcomingConsultations.length > 0 ? (
            upcomingConsultations.slice(0, 3).map((consultation) => (
              <TouchableOpacity
                key={consultation.id}
                onPress={() => {
                  navigation.navigate("ConsultationsTab", {
                    screen: "ConsultationDetail",
                    params: { id: consultation.id },
                  });
                }}
                style={{
                  backgroundColor: "white",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: "#4CAF50",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                  {consultation.title}
                </Text>
                <Text style={{ color: "#666", marginTop: 4 }}>
                  {consultation.consultant.name}
                </Text>
                <Text style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
                  {consultation.date} • {consultation.time}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View
              style={{
                backgroundColor: "white",
                padding: 24,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#999" }}>No upcoming consultations</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ConsultationsTab")}
                style={{ marginTop: 12 }}
              >
                <Text style={{ color: "#0066cc", fontWeight: "600" }}>
                  Book Now
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 12 }}>
            Quick Actions
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("ConsultationsTab", { screen: "Booking" })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#E3F2FD",
                borderRadius: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>📅</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                Book Consultation
              </Text>
              <Text style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                Schedule a new session
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => navigation.navigate("ProjectsTab")}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#FFF3E0",
                borderRadius: 24,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>📊</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                View Projects
              </Text>
              <Text style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                Check project status
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  color: string;
}

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: "center",
      }}
    >
      <Text style={{ color, fontSize: 28, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: "#666", fontSize: 12, marginTop: 8 }}>
        {title}
      </Text>
    </View>
  );
}
