"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmActionButtonProps = {
  title: string;
  description: string;
  triggerLabel: string;
  confirmLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
  successMessage: string;
  errorMessage: string;
  onConfirm: () => Promise<void>;
};

export function ConfirmActionButton({
  title,
  description,
  triggerLabel,
  confirmLabel,
  variant = "default",
  disabled = false,
  successMessage,
  errorMessage,
  onConfirm,
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);

    try {
      await onConfirm();
      toast.success(successMessage);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} disabled={disabled || isPending}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            className={variant === "destructive" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
          >
            {isPending ? "Processando..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
