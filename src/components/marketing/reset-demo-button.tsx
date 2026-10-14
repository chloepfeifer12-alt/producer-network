"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { resetDemoData } from "@/lib/store/db-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

/** Restores the synthetic seed database in this browser (keeps the current demo role). */
export function ResetDemoButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" className={className} onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" /> Reset demo data
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Reset demo data?"
        description="Every change made in this browser — accounts you created, applications, posts, saved items — will be replaced with the original synthetic seed."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemoData();
                setOpen(false);
                toast("Demo data reset", { body: "The original synthetic data has been restored in this browser.", tone: "info" });
              }}
            >
              Reset data
            </Button>
          </>
        }
      />
    </>
  );
}
