import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-primary via-primary to-primary/90 text-primary-foreground shadow-sm hover:shadow-md hover:shadow-primary/25 hover:brightness-110 active:brightness-95 border border-primary/20 hover:border-primary/40',
        destructive:
          'bg-gradient-to-b from-destructive to-destructive/90 text-destructive-foreground shadow-sm hover:shadow-md hover:shadow-destructive/25 hover:brightness-110 active:brightness-95',
        outline:
          'border border-border/80 bg-background/80 hover:bg-accent/80 hover:border-primary/40 hover:text-foreground text-foreground shadow-2xs hover:shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/90 hover:shadow-sm hover:brightness-105',
        ghost:
          'hover:bg-accent/90 hover:text-accent-foreground text-foreground/80 hover:shadow-2xs',
        link:
          'text-primary underline-offset-4 hover:underline cursor-pointer hover:text-primary/80 hover:translate-y-0',
        swap:
          'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-sm hover:shadow-md hover:shadow-purple-500/25 hover:brightness-110 active:brightness-95',
        giveaway:
          'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/25 hover:brightness-110 active:brightness-95',
        premium:
          'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-sm hover:shadow-md hover:shadow-amber-500/30 hover:brightness-110 active:brightness-95 font-bold',
        glass:
          'bg-card/70 backdrop-blur-md border border-border/60 text-foreground hover:bg-card hover:border-primary/30 shadow-2xs hover:shadow-md',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-7 text-base font-bold shadow-md hover:shadow-lg',
        xl: 'h-14 rounded-2xl px-9 text-lg font-bold shadow-lg hover:shadow-xl',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 rounded-lg p-0',
        'icon-lg': 'h-12 w-12 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
