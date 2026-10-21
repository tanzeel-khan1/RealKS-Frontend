import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "border border-primary/40 bg-gradient-to-b from-[#5b7ad4] via-[#3a56c2] to-[#213070] text-white shadow-[0_1px_1px_rgba(6,10,30,0.25),0_6px_14px_-8px_rgba(37,58,140,0.7)] hover:from-[#6b89dc] hover:via-[#435cc9] hover:to-[#273a88] hover:shadow-[0_1px_1px_rgba(6,10,30,0.3),0_8px_18px_-8px_rgba(37,58,140,0.75)] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
        destructive:
          "border border-destructive/30 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-500/90 hover:to-red-600/90",
        outline:
          "border border-border/70 bg-card/85 shadow-[0_1px_1px_rgba(15,23,42,0.02)] backdrop-blur-xl hover:bg-accent hover:text-accent-foreground hover:border-foreground/15",
        secondary:
          "border border-border/70 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
