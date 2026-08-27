import { PageHeading } from "@/components/PageHeading";
import { SkeletonBlock } from "@/components/SkeletonBlock";
import { IconCoin } from "@/components/icons";

export default function CaixaLoading() {
  return (
    <>
      <PageHeading title="Caixa" subtitle="Carregando..." icon={<IconCoin className="w-5 h-5" />} />
      <div className="flex flex-col gap-5">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
    </>
  );
}
