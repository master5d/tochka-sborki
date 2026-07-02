import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const morphingCardVariants = cva(
  "block w-full overflow-hidden transition-all duration-mui-standard ease-mui-in-out border border-transparent @container",
  {
    variants: {
      variant: {
        default:
          "bg-surface-container rounded-3xl hover:rounded-tr-[48px] hover:rounded-bl-[48px] hover:rounded-tl-xl hover:rounded-br-xl hover:bg-surface-container-high hover:border-outline-variant hover:shadow-lg",
        interactive:
          "bg-surface text-on-surface rounded-2xl hover:rounded-full hover:bg-primary hover:text-on-primary cursor-pointer hover:shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface MorphingCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof morphingCardVariants> {}

export const MorphingCard = React.forwardRef<HTMLDivElement, MorphingCardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(morphingCardVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
MorphingCard.displayName = "MorphingCard";
