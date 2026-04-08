import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
        outline: "border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] text-foreground backdrop-blur-sm",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-white/[0.04] backdrop-blur-sm",
        ghost: "hover:bg-white/[0.04] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] bg-[length:200%_100%] hover:bg-right transition-all duration-500",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
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
