import { getAllHeadTeachers, getStudentsWithDays } from "@/app/gruplar/data";
import { GroupGrid } from "@/app/gruplar/group-grid";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantSidebar } from "@/components/shell/assistant-sidebar";
import { requirePageRole } from "@/lib/page-guard";
import { HIDDEN_TEACHER_NAME } from "@/lib/teacher-name";

export const dynamic = "force-dynamic";

export default async function GruplarPage() {
  const user = await requirePageRole("assistant");
  const [students, allHeadTeachers] = await Promise.all([getStudentsWithDays(user), getAllHeadTeachers()]);

  const headTeacherMap = new Map<string, string>();
  for (const s of students) {
    if (s.headTeacherName !== HIDDEN_TEACHER_NAME) headTeacherMap.set(s.headTeacherId, s.headTeacherName);
  }
  const headTeachers = Array.from(headTeacherMap, ([id, name]) => ({ id, name }));

  return (
    <AppShell sidebar={<AssistantSidebar user={user} active="gruplar" />}>
      <GroupGrid initialStudents={students} headTeachers={headTeachers} allHeadTeachers={allHeadTeachers} />
    </AppShell>
  );
}
