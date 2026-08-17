import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuthStore } from "../stores/authStore";

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      // Navigation will be handled by App.tsx based on isAuthenticated state
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: "#0066cc",
            paddingTop: 60,
            paddingBottom: 40,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "white" }}>
            📊
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "white",
              marginTop: 16,
            }}
          >
            Tarun Consulting
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
            Infrastructure & DevOps Consulting
          </Text>
        </View>

        {/* Form */}
        <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 8 }}>
              Welcome Back
            </Text>
            <Text style={{ color: "#666", marginBottom: 24 }}>
              Sign in to your account
            </Text>

            {/* Email Input */}
            <Text style={{ color: "#333", fontWeight: "600", marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 16,
                backgroundColor: "#f9f9f9",
              }}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              editable={!loading}
              keyboardType="email-address"
            />

            {/* Password Input */}
            <Text style={{ color: "#333", fontWeight: "600", marginBottom: 8 }}>
              Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
                fontSize: 16,
                backgroundColor: "#f9f9f9",
              }}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            {/* Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: loading ? "#999" : "#0066cc",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Demo Login */}
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: "#0066cc",
                borderRadius: 8,
                padding: 16,
                alignItems: "center",
              }}
              onPress={() => {
                setEmail("demo@example.com");
                setPassword("demo123");
              }}
              disabled={loading}
            >
              <Text style={{ color: "#0066cc", fontSize: 16, fontWeight: "600" }}>
                Try Demo Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 24, alignItems: "center" }}>
            <Text style={{ color: "#999" }}>Don't have an account?</Text>
            <TouchableOpacity>
              <Text style={{ color: "#0066cc", fontWeight: "600", marginTop: 8 }}>
                Contact us for access
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
