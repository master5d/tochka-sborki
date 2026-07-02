import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-on-surface-variant [&>svg~*]:pl-8",
  {
    variants: {
      variant: {
        default: "bg-surface-variant text-on-surface-variant border-transparent",
        error: "bg-error/10 text-error border-error/20 [&>svg]:text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  slotProps?: {
    root?: React.HTMLAttributes<HTMLDivElement>;
  };
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, slotProps, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        {...props}
        {...slotProps?.root}
        className={cn(alertVariants({ variant }), className, slotProps?.root?.className)}
      >
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      {...props}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className={cn("text-sm [&_p]:leading-relaxed", className)}
    />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
