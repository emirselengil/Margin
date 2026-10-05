import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { LEVELS } from "../lib/levels";

export const roleEnum = pgEnum("role", [
  "admin",
  "head_teacher",
  "assistant",
  "pending",
]);

export const branchRequestStatusEnum = pgEnum("branch_request_status", ["pending", "approved", "rejected"]);

export const homeworkStatusEnum = pgEnum("homework_status", ["done", "missing"]);
export const bookStatusEnum = pgEnum("book_status", ["brought", "not_brought"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["came", "absent"]);

// Kurum: aynı adlı iki kurum olabilir, ayırt eden `id`dir (ad benzersiz değildir).
export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Branş = ders alanı + seviye (örn. Matematik · Lise). Bir öğretmenin tek branşı olur.
export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    level: text("level").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("branches_name_level_unique").on(table.name, table.level),
    check("branches_level_check", sql`${table.level} in (${sql.raw(LEVELS.map((l) => `'${l}'`).join(", "))})`),
  ],
);

// `id` Neon Auth kullanıcı kimliğiyle eşleşir; Neon Auth'un ürettiği kimlik
// her zaman UUID formatında olmayabileceği için text olarak tutulur.
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("pending"),
  isActive: boolean("is_active").notNull().default(true),
  // Yönetici bir öğretmen hesabını "sildiğinde" satır kalır (kayıt
  // geçmişindeki "Giren: ..." isimleri ve öğrenci bağları bozulmasın
  // diye); is_active=false olur ve deletedAt damgalanır, hesap bir
  // daha asla aktifleştirilemez.
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  // Öğretmenin branşı (ders alanı + seviye); yalnızca yönetici atar.
  branchId: uuid("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Kurum ↔ branş (çoka çok): hangi branşlar hangi kurumda var; yalnızca yönetici atar.
// Asistanlar bir kurumda yalnızca o kuruma atanmış branşları görebilir/talep edebilir.
export const institutionBranches = pgTable(
  "institution_branches",
  {
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
  },
  (table) => [primaryKey({ columns: [table.institutionId, table.branchId] })],
);

// Öğretmen ↔ kurum (çoka çok); kurumları yalnızca yönetici atar.
export const teacherInstitutions = pgTable(
  "teacher_institutions",
  {
    teacherId: text("teacher_id")
      .notNull()
      .references(() => profiles.id),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id),
  },
  (table) => [primaryKey({ columns: [table.teacherId, table.institutionId] })],
);

// Asistanın, kendi kurumundaki farklı bir daldaki (aynı seviye) öğretmenleri
// görme talebi. Yönetici onaylarsa o daldaki öğretmenler görünür olur.
export const branchAccessRequests = pgTable(
  "branch_access_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assistantId: text("assistant_id")
      .notNull()
      .references(() => profiles.id),
    institutionId: uuid("institution_id")
      .notNull()
      .references(() => institutions.id),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    status: branchRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: text("decided_by").references(() => profiles.id),
  },
  (table) => [unique("branch_access_requests_unique").on(table.assistantId, table.institutionId, table.branchId)],
);

export const assistantHeadTeachers = pgTable(
  "assistant_head_teachers",
  {
    assistantId: text("assistant_id")
      .notNull()
      .references(() => profiles.id),
    headTeacherId: text("head_teacher_id")
      .notNull()
      .references(() => profiles.id),
  },
  (table) => [primaryKey({ columns: [table.assistantId, table.headTeacherId] })],
);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  className: text("class_name").notNull(),
  headTeacherId: text("head_teacher_id")
    .notNull()
    .references(() => profiles.id),
  // Yönetici bir öğrenciyi "sildiğinde" satır kalır, is_active=false
  // olur: geçmiş etüt kayıtları ve istatistikler korunur, öğrenci
  // yalnızca aktif listelerden/etüt akışından kaybolur.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentStudyDays = pgTable(
  "student_study_days",
  {
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    // 0 = Pazartesi … 6 = Pazar
    weekday: smallint("weekday").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.studentId, table.weekday] }),
    check("student_study_days_weekday_check", sql`${table.weekday} between 0 and 6`),
  ],
);

export const studyRecords = pgTable(
  "study_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),
    date: date("date").notNull(),
    // Asistan etüt listesinde ödev ve kitabı birbirinden bağımsız
    // tek tıkla, anında kaydeder; bu yüzden ikisi de başta null
    // olabilir (yalnızca biri seçilmiş olabilir).
    homework: homeworkStatusEnum("homework"),
    book: bookStatusEnum("book"),
    attendance: attendanceStatusEnum("attendance"),
    note: text("note"),
    createdBy: text("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    editedByAdmin: boolean("edited_by_admin").notNull().default(false),
  },
  (table) => [unique("study_records_student_date_unique").on(table.studentId, table.date)],
);

export const recordHistory = pgTable("record_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  recordId: uuid("record_id")
    .notNull()
    .references(() => studyRecords.id, { onDelete: "cascade" }),
  changedBy: text("changed_by")
    .notNull()
    .references(() => profiles.id),
  before: jsonb("before").notNull(),
  after: jsonb("after").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  headTeacherStudents: many(students),
  asAssistantOf: many(assistantHeadTeachers, { relationName: "assistantLink" }),
  asHeadTeacherOf: many(assistantHeadTeachers, { relationName: "headTeacherLink" }),
}));

export const assistantHeadTeachersRelations = relations(assistantHeadTeachers, ({ one }) => ({
  assistant: one(profiles, {
    fields: [assistantHeadTeachers.assistantId],
    references: [profiles.id],
    relationName: "assistantLink",
  }),
  headTeacher: one(profiles, {
    fields: [assistantHeadTeachers.headTeacherId],
    references: [profiles.id],
    relationName: "headTeacherLink",
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  headTeacher: one(profiles, {
    fields: [students.headTeacherId],
    references: [profiles.id],
  }),
  studyDays: many(studentStudyDays),
  studyRecords: many(studyRecords),
}));

export const studentStudyDaysRelations = relations(studentStudyDays, ({ one }) => ({
  student: one(students, {
    fields: [studentStudyDays.studentId],
    references: [students.id],
  }),
}));

export const studyRecordsRelations = relations(studyRecords, ({ one, many }) => ({
  student: one(students, {
    fields: [studyRecords.studentId],
    references: [students.id],
  }),
  createdByProfile: one(profiles, {
    fields: [studyRecords.createdBy],
    references: [profiles.id],
  }),
  history: many(recordHistory),
}));

export const recordHistoryRelations = relations(recordHistory, ({ one }) => ({
  record: one(studyRecords, {
    fields: [recordHistory.recordId],
    references: [studyRecords.id],
  }),
  changedByProfile: one(profiles, {
    fields: [recordHistory.changedBy],
    references: [profiles.id],
  }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Institution = typeof institutions.$inferSelect;
export type Branch = typeof branches.$inferSelect;
export type BranchAccessRequest = typeof branchAccessRequests.$inferSelect;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type StudentStudyDay = typeof studentStudyDays.$inferSelect;
export type StudyRecord = typeof studyRecords.$inferSelect;
export type NewStudyRecord = typeof studyRecords.$inferInsert;
export type RecordHistory = typeof recordHistory.$inferSelect;
export type AssistantHeadTeacher = typeof assistantHeadTeachers.$inferSelect;
