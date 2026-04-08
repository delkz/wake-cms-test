"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border",
          title: "text-sm font-medium",
          description: "text-sm",
        },
      }}
      {...props}
    />
  );
}
