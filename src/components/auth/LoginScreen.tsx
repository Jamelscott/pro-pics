import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, MaxContentWidth } from "@/constants/theme";
import { signInWithEmailPassword } from "@/lib/auth";

type LoginScreenProps = {
  sessionError: string | null;
};

export default function LoginScreen({ sessionError }: LoginScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [email, setEmail] = useState("itsjamelscott@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailPassword(normalizedEmail, password);
    } catch (signInError: unknown) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "We couldn't sign you in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>P</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>
              Pro Pics
            </Text>
            <Text style={[styles.heading, { color: colors.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Sign in to keep your photos and projects together.
            </Text>

            {sessionError ? (
              <Text
                accessibilityRole="alert"
                style={[styles.notice, styles.noticeWarning]}
              >
                {`We couldn't restore your saved sign-in: ${sessionError}`}
              </Text>
            ) : null}
            {error ? (
              <Text
                accessibilityRole="alert"
                style={[styles.notice, styles.noticeError]}
              >
                {error}
              </Text>
            ) : null}

            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="email-address"
                onChangeText={setEmail}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected,
                    color: colors.text,
                  },
                ]}
                textContentType="emailAddress"
                value={email}
              />

              <Text
                style={[
                  styles.label,
                  styles.passwordLabel,
                  { color: colors.text },
                ]}
              >
                Password
              </Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isSubmitting}
                onChangeText={setPassword}
                onSubmitEditing={handleSignIn}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                ref={passwordInputRef}
                returnKeyType="go"
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.backgroundSelected,
                    color: colors.text,
                  },
                ]}
                textContentType="password"
                value={password}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isSubmitting,
                  busy: isSubmitting,
                }}
                disabled={isSubmitting}
                onPress={handleSignIn}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !isSubmitting && styles.submitButtonPressed,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Sign in</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "stretch",
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "#208AEF",
    marginBottom: 12,
  },
  brandMarkText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  brandName: {
    alignSelf: "center",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 36,
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 30,
  },
  notice: {
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
    marginBottom: 16,
  },
  noticeWarning: {
    backgroundColor: "#FFF3D6",
    color: "#704900",
  },
  noticeError: {
    backgroundColor: "#FDE8E7",
    color: "#9E2521",
  },
  form: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 20,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#208AEF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  submitButtonPressed: {
    opacity: 0.86,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
