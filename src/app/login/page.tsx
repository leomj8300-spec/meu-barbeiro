import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return <LoginForm erroInicial={erro === "conta-removida" ? "Sua conta foi removida ou o acesso mudou. Faça login novamente." : null} />;
}
