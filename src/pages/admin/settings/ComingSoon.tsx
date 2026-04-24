import { Sparkles } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";

type Props = {
  title: string;
  description: string;
};

export default function ComingSoon({ title, description }: Props) {
  return (
    <section className="max-w-2xl space-y-8">
      <SettingsPageHeader title={title} description={description} />
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card/50 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Em breve</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta seção ainda está em desenvolvimento.
        </p>
      </div>
    </section>
  );
}