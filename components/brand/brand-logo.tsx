import Image from "next/image";

import { brand } from "@/lib/design-system";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { width: 120, height: 40, className: "h-8 w-auto" },
  md: { width: 180, height: 60, className: "h-12 w-auto" },
  lg: { width: 280, height: 93, className: "h-20 w-auto max-w-[min(280px,85vw)]" },
} as const;

export function BrandLogo({
  size = "md",
  className,
  priority = false,
}: {
  size?: keyof typeof sizes;
  className?: string;
  priority?: boolean;
}) {
  const cfg = sizes[size];
  return (
    <Image
      src="/logo-horautil-360.png"
      alt={brand.name}
      width={cfg.width}
      height={cfg.height}
      priority={priority}
      className={cn(cfg.className, "object-contain", className)}
    />
  );
}
