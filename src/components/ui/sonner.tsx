import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const WaveBg = ({ fill }: { fill: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 1440 320"
    xmlns="http://www.w3.org/2000/svg"
    className="pointer-events-none absolute -left-[31px] top-[32px] w-20 rotate-90"
    style={{ fill }}
  >
    <path d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L0,320Z" />
  </svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={color} className="h-[17px] w-[17px]">
    <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
  </svg>
);

const XIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={color} className="h-[17px] w-[17px]">
    <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z" />
  </svg>
);

const InfoIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={color} className="h-[17px] w-[17px]">
    <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm-32-128c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V248c0-13.3-10.7-24-24-24h-16c-13.3 0-24 10.7-24 24v136zm32-208a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
  </svg>
);

const WarnIcon = ({ color }: { color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={color} className="h-[17px] w-[17px]">
    <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24v112c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
  </svg>
);

type Variant = "success" | "error" | "info" | "warning";

const VARIANT_COLORS: Record<Variant, { title: string; icon: string; iconBg: string; wave: string }> = {
  success: { title: "#269b24", icon: "#269b24", iconBg: "#04e40048", wave: "#04e4003a" },
  error:   { title: "#c81e1e", icon: "#c81e1e", iconBg: "#ef44444a", wave: "#ef44443a" },
  info:    { title: "#1d4ed8", icon: "#1d4ed8", iconBg: "#3b82f64a", wave: "#3b82f63a" },
  warning: { title: "#b45309", icon: "#b45309", iconBg: "#f59e0b4a", wave: "#f59e0b3a" },
};

const makeIcon = (variant: Variant) => {
  const c = VARIANT_COLORS[variant];
  const Icon = variant === "success" ? CheckIcon : variant === "error" ? XIcon : variant === "warning" ? WarnIcon : InfoIcon;
  const Component = () => (
    <>
      <WaveBg fill={c.wave} />
      <span
        className="relative z-10 flex h-[35px] w-[35px] flex-shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: c.iconBg }}
      >
        <Icon color={c.icon} />
      </span>
    </>
  );
  Component.displayName = `ToastIcon(${variant})`;
  return Component;
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
        info: <InfoVariantIcon />,
        warning: <WarningIcon />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast relative overflow-hidden group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-0 group-[.toaster]:shadow-[rgba(149,157,165,0.2)_0px_8px_24px] group-[.toaster]:rounded-lg group-[.toaster]:px-4 group-[.toaster]:py-4 group-[.toaster]:gap-[15px] group-[.toaster]:min-h-[80px] group-[.toaster]:w-[330px] group-[.toaster]:!items-center [&>[data-icon]]:!m-0 [&>[data-icon]]:!self-center [&>[data-content]]:!self-center",
          title: "group-[.toast]:font-bold group-[.toast]:text-[17px] group-[.toast]:leading-tight",
          description: "group-[.toast]:text-[#555] group-[.toast]:text-[14px] group-[.toast]:leading-tight",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!bg-transparent group-[.toast]:!border-0 group-[.toast]:!text-[#555] hover:group-[.toast]:!text-foreground group-[.toast]:!left-auto group-[.toast]:!right-3 group-[.toast]:!top-1/2 group-[.toast]:!-translate-y-1/2",
          success: "[&_[data-title]]:!text-[#269b24]",
          error: "[&_[data-title]]:!text-[#c81e1e]",
          info: "[&_[data-title]]:!text-[#1d4ed8]",
          warning: "[&_[data-title]]:!text-[#b45309]",
        },
      }}
      closeButton
      {...props}
    />
  );
};

export { Toaster, toast };
