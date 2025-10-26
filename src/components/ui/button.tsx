import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:shadow-[0_0_20px_hsl(var(--primary-glow)/0.4),inset_0_0_20px_hsl(var(--primary-glow)/0.1)]",
        destructive: "bg-destructive text-destructive-foreground hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4),inset_0_0_20px_hsl(var(--destructive)/0.1)]",
        outline: "border border-border bg-card hover:border-primary hover:shadow-[0_0_15px_hsl(var(--primary)/0.3),inset_0_0_15px_hsl(var(--primary)/0.05)]",
        secondary: "bg-secondary text-secondary-foreground hover:shadow-[0_0_15px_hsl(var(--primary)/0.2),inset_0_0_15px_hsl(var(--primary)/0.05)]",
        ghost: "hover:bg-muted hover:shadow-[inset_0_0_15px_hsl(var(--primary)/0.05)]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
