CREATE TYPE "public"."attendance_status" AS ENUM('came', 'absent');--> statement-breakpoint
ALTER TABLE "study_records" ADD COLUMN "attendance" "attendance_status";