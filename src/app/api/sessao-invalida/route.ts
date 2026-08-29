import { redirect } from "next/navigation";
import { signOut } from "@/auth";

/**
 * Chamado quando um Server Component detecta que o usuário da sessão não
 * existe mais no banco (conta removida, ou a barbearia inteira excluída).
 * signOut() só limpa o cookie de verdade quando roda num Server Action ou
 * Route Handler — chamá-lo direto durante a renderização de uma página não
 * funciona, por isso essa rota existe só pra fazer esse logout e redirecionar
 * com um aviso. Usa redirect:false + redirect() explícito em vez de
 * redirectTo — passar redirectTo aqui faz o meio de campo do NextAuth trocar
 * a URL final pelo próprio esquema de callbackUrl, perdendo o aviso.
 */
export async function GET() {
  await signOut({ redirect: false });
  redirect("/login?erro=conta-removida");
}
