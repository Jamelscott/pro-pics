import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useUser } from "@/context/UserContext";
import {
  requestPasswordReset,
  signInWithEmailPassword,
  signOut,
  updatePassword,
} from "@/lib/auth";

type Mode = "signin" | "forgot" | "sent" | "newPassword";

const MIN_PASSWORD_LENGTH = 8;

const HEADINGS: Record<Mode, { title: string; description: string }> = {
  signin: {
    title: "Welcome back",
    description: "Sign in to keep your photos and projects together.",
  },
  forgot: {
    title: "Reset password",
    description: "Enter your email and we'll send you a reset link.",
  },
  sent: {
    title: "Check your email",
    description: "Tap the link in the email to choose a new password.",
  },
  newPassword: {
    title: "Choose a new password",
    description: "Pick a password you'll remember.",
  },
};

type LoginScreenProps = {
  sessionError: string | null;
};

export default function LoginScreen({ sessionError }: LoginScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const { isRecoveringPassword, setIsRecoveringPassword } = useUser();
  const [storedMode, setMode] = useState<Mode>("signin");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);

  // Opening the emailed link puts the app into recovery mode.
  const mode: Mode = isRecoveringPassword ? "newPassword" : storedMode;

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.backgroundElement,
      borderColor: colors.backgroundSelected,
      color: colors.text,
    },
  ];

  const run = async (action: () => Promise<void>, fallback: string) => {
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    try {
      await action();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToMode = (next: Mode) => {
    setError(null);
    setInfo(null);
    setMode(next);
  };

  const handleSendCode = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email address.");
      return Promise.resolve();
    }
    return run(async () => {
      await requestPasswordReset(normalizedEmail);
      setMode("sent");
      setInfo(`If an account exists for ${normalizedEmail}, we sent a link.`);
    }, "We couldn't send the reset email. Please try again.");
  };

  const handleSetPassword = () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return Promise.resolve();
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return Promise.resolve();
    }
    return run(async () => {
      await updatePassword(newPassword);
      setIsRecoveringPassword(false);
    }, "We couldn't update your password. Please try again.");
  };

  const handleCancelRecovery = () =>
    run(async () => {
      await signOut();
      setIsRecoveringPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      setMode("signin");
    }, "Something went wrong. Please try again.");

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
        behavior="padding"
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
              {HEADINGS[mode].title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {HEADINGS[mode].description}
            </Text>
            {info ? (
              <Text style={[styles.notice, styles.noticeInfo]}>{info}</Text>
            ) : null}

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

            {mode === "signin" ? (
              <View style={styles.form}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Email
                </Text>
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
                  disabled={isSubmitting}
                  onPress={() => goToMode("forgot")}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Forgot password?</Text>
                </Pressable>

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
            ) : mode === "forgot" ? (
              <View style={styles.form}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Email
                </Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSecondary}
                  style={inputStyle}
                  value={email}
                  autoComplete="email"
                  keyboardType="email-address"
                  onSubmitEditing={handleSendCode}
                  returnKeyType="go"
                  textContentType="emailAddress"
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isSubmitting,
                    busy: isSubmitting,
                  }}
                  disabled={isSubmitting}
                  onPress={handleSendCode}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !isSubmitting && styles.submitButtonPressed,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send reset link</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => goToMode("signin")}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Back to sign in</Text>
                </Pressable>
              </View>
            ) : mode === "sent" ? (
              <View style={styles.form}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={handleSendCode}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Resend email</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => goToMode("signin")}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Back to sign in</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={[styles.label, { color: colors.text }]}>
                  New password
                </Text>
                <TextInput
                  accessibilityLabel="New password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textSecondary}
                  style={inputStyle}
                  value={newPassword}
                  autoComplete="new-password"
                  secureTextEntry
                  textContentType="newPassword"
                />
                <Text
                  style={[
                    styles.label,
                    styles.passwordLabel,
                    { color: colors.text },
                  ]}
                >
                  Confirm password
                </Text>
                <TextInput
                  accessibilityLabel="Confirm password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textSecondary}
                  style={inputStyle}
                  value={confirmPassword}
                  autoComplete="new-password"
                  onSubmitEditing={handleSetPassword}
                  returnKeyType="go"
                  secureTextEntry
                  textContentType="newPassword"
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isSubmitting,
                    busy: isSubmitting,
                  }}
                  disabled={isSubmitting}
                  onPress={handleSetPassword}
                  style={({ pressed }) => [
                    styles.submitButton,
                    pressed && !isSubmitting && styles.submitButtonPressed,
                    isSubmitting && styles.submitButtonDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update password</Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={handleCancelRecovery}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Cancel</Text>
                </Pressable>
              </View>
            )}
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
  noticeInfo: {
    backgroundColor: "#E3F1FD",
    color: "#0B4F8A",
  },
  linkButton: {
    alignSelf: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  linkText: {
    color: "#208AEF",
    fontSize: 14,
    fontWeight: "600",
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
