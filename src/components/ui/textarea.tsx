"use client";

import * as React from "react";

import { cn } from "@/src/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export { Textarea };