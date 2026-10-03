"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addMyStudentAction } from "@/app/ogrencilerim/actions";
import { AddStudentDialog } from "@/components/add-student-dialog";

export function AddMyStudentButton({ headTeacherId, headTeacherName }: { headTeacherId: string; headTeacherName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(data: { fullName: string; className: string }) {
    setError(null);
    startTransition(async () => {
      try {
        await addMyStudentAction(data.fullName, data.className);
        setOpen(false);
        router.refresh();
      } catch {
        setError("Öğrenci eklenemedi, lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-sunken hover:border-line-2 active:bg-line"
      >
        <Plus size={14} aria-hidden="true" />
        Öğrenci ekle
      </button>
      <AddStudentDialog
        open={open}
        headTeacherOptions={[{ id: headTeacherId, name: headTeacherName }]}
        pending={pending}
        error={error}
        onSubmit={submit}
        onCancel={() => {
          setOpen(false);
          setError(null);
        }}
      />
    </>
  );
}
