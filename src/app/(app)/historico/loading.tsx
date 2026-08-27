import { PageHeading } from "@/components/PageHeading";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { IconHistory } from "@/components/icons";

export default function HistoricoLoading() {
  return (
    <>
      <PageHeading
        title="Histórico"
        subtitle="Atendimentos registrados"
        icon={<IconHistory className="w-5 h-5" />}
      />
      <div className="flex flex-col gap-5">
        <SkeletonBlock className="h-8 w-40" />
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
        </div>
      </div>
    </>
  );
}
