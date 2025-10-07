-- CreateTable
CREATE TABLE "reminders" (
    "reminder_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "service_record_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reminder_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "sent_at" DATETIME,
    "outlook_event_id" TEXT,
    "outlook_email_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL DEFAULT 'system',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reminders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("customer_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminders_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records" ("record_id") ON DELETE SET NULL ON UPDATE CASCADE
);
