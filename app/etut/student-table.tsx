"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { StudentForDay } from "@/app/etut/data";
import { StudentRow } from "@/app/etut/student-row";

export function StudentTable({ students, dateISO }: { students: StudentForDay[]; dateISO: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return students;
    return students.filter((s) => s.fullName.toLocaleLowerCase("tr").includes(q));
  }, [students, query]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-surface-2 px-[18px] py-3.5">
        <h2 className="m-0 text-[15px] font-semibold">
          Öğrenciler <span className="font-mono text-[13px] font-normal text-muted">{students.length}</span>
        </h2>
        <div className="flex items-center gap-2.5">
          <span className="hidden text-xs text-muted sm:inline">Seçimler anında kaydedilir</span>
          <div className="relative">
            <label htmlFor="etut-ara" className="sr-only">
              Öğrenci ara
            </label>
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="etut-ara"
              type="search"
              placeholder="Öğrenci ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-44 rounded-[9px] border border-line bg-sunken pl-8 pr-2.5 text-[13px] text-ink outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="px-[18px] py-10 text-center text-ink-2">Bugün etüde gelecek öğrenci yok.</p>
      ) : filtered.length === 0 ? (
        <p className="px-[18px] py-10 text-center text-ink-2">
          “{query}” ile eşleşen öğrenci bulunamadı.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] border-collapse">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-[18px] py-2.5 font-medium">Öğrenci</th>
                <th className="px-3 py-2.5 font-medium">Öğretmen</th>
                <th className="px-3 py-2.5 font-medium">Katılım</th>
                <th className="px-3 py-2.5 font-medium">Ödev</th>
                <th className="px-3 py-2.5 font-medium">Kitap</th>
                <th className="px-3 py-2.5 font-medium">Not</th>
                <th className="px-3 py-2.5 font-medium">Öğretmen notu</th>
                <th className="px-[18px] py-2.5">
                  <span className="sr-only">Aç</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <StudentRow key={s.id} student={s} dateISO={dateISO} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
