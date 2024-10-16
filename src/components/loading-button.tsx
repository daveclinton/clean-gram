"use client";

import { forwardRef } from "react";
import { Button, type ButtonProps } from "./ui/button";
import { cn } from "~/lib/utils";
import { AnimatedSpinner } from "./ui/icons";

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        disabled={props.disabled ? props.disabled : loading}
        className={cn(className, "relative")}
      >
        <span className={cn(loading ? "opacity-0" : "")}>{children}</span>
        {loading ? (
          <div className="absolute inset-0 grid place-items-center">
            <AnimatedSpinner className="h-6 w-6" />
          </div>
        ) : null}
      </Button>
    );
  },
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
