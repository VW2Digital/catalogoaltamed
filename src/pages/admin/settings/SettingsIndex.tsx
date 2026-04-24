import { Link } from "react-router-dom";
import {
  ChevronRight,
  MessageCircle,
  Tag,
  Award,
  Image as ImageIcon,
  Palette,
  Type,
  Code2,
  Settings2,
  Paintbrush,
  FolderOpen,
} from "lucide-react";

type Item = {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Section = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Item[];
};

const sections: Section[] = [
  {
    title: "Geral",
    icon: Settings2,
    items: [
      {
        to: "whatsapp",
        title: "WhatsApp",
        description: "Número que receberá as consultas de preço",
        icon: MessageCircle,
      },
    ],
  },
  {
    title: "Catálogo",
    icon: FolderOpen,
    items: [
      {
        to: "categories",
        title: "Categorias",
        description: "Organize as categorias de cada catálogo",
        icon: Tag,
      },
      {
        to: "brands",
        title: "Marcas",
        description: "Organize as marcas de cada catálogo",
        icon: Award,
      },
    ],
  },
  {
    title: "Design & Identidade",
    icon: Paintbrush,
    items: [
      {
        to: "branding",
        title: "Logo & Identidade",
        description: "Logo, nome da loja e SEO",
        icon: ImageIcon,
      },
      {
        to: "theme",
        title: "Cores do Tema",
        description: "Cor primária e identidade visual",
        icon: Palette,
      },
      {
        to: "fonts",
        title: "Fontes",
        description: "Fonte dos títulos e do corpo do texto",
        icon: Type,
      },
      {
        to: "css",
        title: "CSS Customizado",
        description: "Estilos personalizados para a loja",
        icon: Code2,
      },
    ],
  },
];

export default function SettingsIndex() {
  return (
    <section className="max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight uppercase">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie as integrações e preferências da loja.
      </p>

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <section.icon className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">
                {section.title}
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
              {section.items.map((item, idx) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 ${
                    idx > 0 ? "border-t" : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}