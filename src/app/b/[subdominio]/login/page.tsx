import { notFound } from "next/navigation";
import { getBarbeariaPorSubdominio } from "@/lib/admin";
import { LoginForm } from "@/app/login/LoginForm";

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ subdominio: string }>;
}) {
  const { subdominio } = await params;
  const barbearia = await getBarbeariaPorSubdominio(subdominio);
  if (!barbearia) notFound();

  return <LoginForm barbeariaId={barbearia.id} nomeBarbearia={barbearia.nome} />;
}
