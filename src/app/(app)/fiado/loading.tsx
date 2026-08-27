import { PageHeading } from "@/components/PageHeading";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { IconTagClock } from "@/components/icons";

export default function FiadoLoading() {
  return (
    <>
      <PageHeading
        title="Fiado"
        subtitle="Atendimentos pendentes de pagamento"
        icon={<IconTagClock className="w-5 h-5" />}
      />
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-24 mb-3" />
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-16" />
        <SkeletonBlock className="h-16" />
      </div>
    </>
  );
}
