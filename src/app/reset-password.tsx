import { Redirect } from "expo-router";

// Landing route for the password-reset deep link; the auth flow is handled in UserProvider.
export default function ResetPasswordRoute() {
  return <Redirect href="/" />;
}
