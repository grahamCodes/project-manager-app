-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "by_weekday" INTEGER[],
    "by_monthday" INTEGER[],
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_instances" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurrence_rules_task_id_key" ON "recurrence_rules"("task_id");

-- CreateIndex
CREATE INDEX "task_instances_task_id_due_date_idx" ON "task_instances"("task_id", "due_date");

-- AddForeignKey
ALTER TABLE "recurrence_rules" ADD CONSTRAINT "recurrence_rules_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
