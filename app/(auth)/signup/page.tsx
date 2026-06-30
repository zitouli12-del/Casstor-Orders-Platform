import AuthLayout from "@/src/components/auth/AuthLayout";
import SignupForm from "@/src/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}