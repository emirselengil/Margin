"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { setAttendanceAction, setBookAction, setHomeworkAction } from "@/app/etut/actions";
import type { StudentForDay } from "@/app/etut/data";
import { Avatar, ColorDot } from "@/components/avatar";
import { StatusToggle } from "@/components/status-toggle";

const HOMEWORK_OPTIONS = [
  { value: "done", label: "Yapıldı", tone: "pos" },
  { value: "missing", label: "Eksik", tone: "neg" },
] as const;

const ATTENDANCE_OPTIONS = [
  { value: "came", label: "Geldi", tone: "pos" },
  { value: "absent", label: "Gelmedi", tone: "neg" },
] as const;

const BOOK_OPTIONS = [
  { value: "brought", label: "Getirdi", tone: "pos" },
  { value: "not_brought", label: "Getirmedi", tone: "neg" },
] as const;

export function StudentRow({ student, dateISO }: { student: StudentForDay; dateISO: string }) {
  const [homework, setHomework] = useState(student.homework);
  const [book, setBook] = useState(student.book);
  const [attendance, setAttendance] = useState(student.attendance);
  const [pending, startTransition] = useTransition();

  function handleHomework(value: string) {
    setHomework(value as typeof homework);
    startTransition(async () => {
      await setHomeworkAction(student.id, dateISO, value as "done" | "missing");
    });
  }

  function handleAttendance(value: string) {
    setAttendance(value as typeof attendance);
    startTransition(async () => {
      await setAttendanceAction(student.id, dateISO, value as "came" | "absent");
    });
  }

  function handleBook(value: string) {
    setBook(value as typeof book);
    startTransition(async () => {
      await setBookAction(student.id, dateISO, value as "brought" | "not_brought");
    });
  }

  return (
    <tr className="border-t border-line transition-colors hover:bg-surface-2">
      <td className="px-[18px] py-2.5">
        <Link
          href={`/etut/${student.id}?date=${dateISO}`}
          className="flex items-center gap-3 text-ink no-underline transition-colors hover:text-accent-text"
        >
          <Avatar name={student.fullName} colorId={student.headTeacherId} />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{student.fullName}</span>
            <span className="font-mono text-xs text-muted">{student.className}</span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-2.5 text-ink-2">
        <span className="inline-flex items-center gap-2">
          <ColorDot colorId={student.headTeacherId} />
          {student.headTeacherName}
        </span>
      </td>
      <td className="px-3 py-1.5">
        <StatusToggle value={attendance} options={ATTENDANCE_OPTIONS} onSelect={handleAttendance} pending={pending} />
      </td>
      <td className="px-3 py-1.5">
        <StatusToggle value={homework} options={HOMEWORK_OPTIONS} onSelect={handleHomework} pending={pending} />
      </td>
      <td className="px-3 py-1.5">
        <StatusToggle value={book} options={BOOK_OPTIONS} onSelect={handleBook} pending={pending} />
      </td>
      <td className="max-w-[240px] px-3 py-2.5 text-[13px]">
        {student.note ? (
          <span className="text-ink-2">{student.note}</span>
        ) : (
          <Link
            href={`/etut/${student.id}?date=${dateISO}`}
            className="font-medium text-accent-text no-underline hover:underline"
          >
            + Not ekle
          </Link>
        )}
      </td>
      <td className="max-w-[240px] px-3 py-2.5 text-[13px] text-ink-2">{student.headTeacherNote || "—"}</td>
      <td className="px-[18px] py-2.5 text-right">
        <Link
          href={`/etut/${student.id}?date=${dateISO}`}
          aria-label="Öğrenciyi aç"
          className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </td>
    </tr>
  );
}
