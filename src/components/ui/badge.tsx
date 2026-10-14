import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border border-current text-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        sell: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        swap: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        giveaway: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        'sell-swap': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
        new: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        'like-new': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
        'very-good': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
        good: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        acceptable: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        featured: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
        admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
