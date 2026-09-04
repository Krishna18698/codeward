import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password — Codeward" };

type Props = { searchParams: Promise<{ token?: string; email?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, email } = await searchParams;
  return <ResetPasswordForm token={token} email={email} />;
}
