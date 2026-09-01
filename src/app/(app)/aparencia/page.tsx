import { auth } from "@/auth";
import { getPreferenciasTema } from "@/lib/queries";
import { PageHeading } from "@/components/PageHeading";
import { IconContrast } from "@/components/icons";
import { PreferenciasTema } from "@/components/PreferenciasTema";

export default async function AparenciaPage() {
  const session = await auth();
  if (!session?.user) return null;

  const prefs = await getPreferenciasTema(session.user.id);

  return (
    <>
      <PageHeading
        title="Aparência"
        subtitle="Como o app se comporta na sua luz"
        icon={<IconContrast className="w-5 h-5" />}
      />
      <PreferenciasTema temaCor={prefs.temaCor} temaModo={prefs.temaModo} />
    </>
  );
}
