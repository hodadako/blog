import {cva, type VariantProps} from "class-variance-authority";

// shadcn/ui's CVA composition pattern, using hodako's semantic tokens and geometry.
export const buttonVariants = cva(
  "button inline-flex shrink-0 items-center justify-center gap-control-gap whitespace-nowrap rounded-control border border-solid font-interface font-control text-control leading-normal tracking-normal no-underline cursor-pointer transition-colors duration-(--motion-ui) motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-focus disabled:cursor-not-allowed disabled:opacity-(--button-disabled-opacity) [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-ui-primary bg-ui-primary text-ui-primary-foreground not-disabled:hover:border-ui-primary-hover not-disabled:hover:bg-ui-primary-hover not-disabled:active:border-ui-primary-hover not-disabled:active:bg-ui-primary-hover",
        secondary: "border-transparent bg-ui-secondary text-ui-text not-disabled:hover:bg-ui-secondary-hover not-disabled:active:bg-ui-selected",
        outline: "border-ui-border bg-transparent text-ui-text not-disabled:hover:bg-ui-hover not-disabled:active:bg-ui-selected",
        ghost: "border-transparent bg-transparent text-ui-muted not-disabled:hover:bg-ui-hover not-disabled:hover:text-ui-text not-disabled:active:bg-ui-selected",
        destructive: "border-transparent bg-ui-danger-soft text-ui-danger not-disabled:hover:border-ui-danger not-disabled:active:border-ui-danger",
      },
      size: {
        sm: "min-h-control-sm min-w-control-sm px-control-x-sm py-control-y text-control-sm",
        md: "min-h-control-md min-w-control-sm px-control-x py-control-y",
        lg: "min-h-control-lg min-w-control-sm px-control-x-lg py-control-y",
        icon: "size-control-sm p-0",
      },
    },
    defaultVariants: {variant: "primary", size: "md"},
  },
);

export const selectedControlClasses = "aria-pressed:border-ui-selected-border aria-pressed:bg-ui-selected aria-pressed:text-ui-text aria-expanded:border-ui-selected-border aria-expanded:bg-ui-selected aria-expanded:text-ui-text aria-[current=page]:border-ui-selected-border aria-[current=page]:bg-ui-selected aria-[current=page]:text-ui-text aria-selected:border-ui-selected-border aria-selected:bg-ui-selected aria-selected:text-ui-text aria-checked:border-ui-selected-border aria-checked:bg-ui-selected aria-checked:text-ui-text";

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
