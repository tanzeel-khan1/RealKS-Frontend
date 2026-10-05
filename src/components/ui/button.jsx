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
          "border border-[#b3891f]/40 bg-gradient-to-b from-[#ecbf45] to-[#c89b2a] text-[#2b1f04] shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_1px_2px_rgba(0,0,0,0.25),0_10px_24px_-10px_rgba(199,154,39,0.7)] hover:from-[#f6cb52] hover:to-[#d4a72f] hover:shadow-[0_1px_0_rgba(255,255,255,0.45)_inset,0_1px_3px_rgba(0,0,0,0.28),0_14px_28px_-10px_rgba(199,154,39,0.75)]",
        destructive:
          "border border-destructive/30 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-500/90 hover:to-red-600/90",
        outline:
          "border border-border bg-card/60 shadow-sm backdrop-blur hover:bg-accent hover:text-accent-foreground hover:border-foreground/20",
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
