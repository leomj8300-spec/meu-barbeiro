import { PageHeading } from "@/components/PageHeading";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { IconScissors } from "@/components/icons";

export default function AtendimentoLoading() {
  return (
    <>
      <PageHeading
        title="Atendimento"
        subtitle="Registrar corte e consumos"
        icon={<IconScissors className="w-5 h-5" />}
      />
      <div className="flex flex-col gap-4">
        <SkeletonBlock className="h-[52px]" />
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-24" />
      </div>
    </>
  );
}
