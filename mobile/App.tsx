import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "./stores/authStore";
import { useConsultationStore } from "./stores/consultationStore";

// Screens
import HomeScreen from "./screens/HomeScreen";
import ConsultationsScreen from "./screens/ConsultationsScreen";
import ConsultationDetailScreen from "./screens/ConsultationDetailScreen";
import BookingScreen from "./screens/BookingScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ConsultationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: "#0066cc",
      }}
    >
      <Stack.Screen
        name="ConsultationsList"
        component={ConsultationsScreen}
        options={{ title: "My Consultations" }}
      />
      <Stack.Screen
        name="ConsultationDetail"
        component={ConsultationDetailScreen}
        options={{ title: "Consultation Details" }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: "Book Consultation" }}
      />
    </Stack.Navigator>
  );
}

function ProjectsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: "#0066cc",
      }}
    >
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsScreen}
        options={{ title: "My Projects" }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: "Project Details" }}
      />
    </Stack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name !== "HomeStack",
        tabBarActiveTintColor: "#0066cc",
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: { fontSize: 12, marginTop: -5 },
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeScreen}
        options={{
          title: "Home",
          headerTitle: "Tarun Consulting",
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ConsultationsTab"
        component={ConsultationsStack}
        options={{ title: "Consultations", headerShown: false }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsStack}
        options={{ title: "Projects", headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile", headerShown: true }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is authenticated
        const token = await AsyncStorage.getItem("authToken");
        const user = await AsyncStorage.getItem("user");

        if (token && user) {
          setIsAuthenticated(true);
          useAuthStore.setState({
            token,
            user: JSON.parse(user),
            isAuthenticated: true,
          });
        }

        // Load cached data
        const consultations = await AsyncStorage.getItem("consultations");
        if (consultations) {
          useConsultationStore.setState({
            consultations: JSON.parse(consultations),
          });
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={HomeTabs} />
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
