CREATE TYPE "WorkflowHistoryEventType" AS ENUM (
  'SAVED_FOR_REVIEW',
  'UPDATED_REVIEW',
  'REJECTED',
  'PUBLISHED'
);

CREATE TABLE "WorkflowItemHistory" (
  "id" TEXT NOT NULL,
  "workflowItemId" TEXT,
  "entityType" "WorkflowEntityType" NOT NULL,
  "action" "WorkflowAction" NOT NULL,
  "status" "WorkflowStatus" NOT NULL,
  "eventType" "WorkflowHistoryEventType" NOT NULL,
  "targetEntityId" TEXT,
  "wakeEntityId" TEXT,
  "title" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkflowItemHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkflowItemHistory_workflowItemId_createdAt_idx"
ON "WorkflowItemHistory"("workflowItemId", "createdAt");

CREATE INDEX "WorkflowItemHistory_targetEntityId_createdAt_idx"
ON "WorkflowItemHistory"("targetEntityId", "createdAt");

CREATE INDEX "WorkflowItemHistory_retentionUntil_idx"
ON "WorkflowItemHistory"("retentionUntil");

ALTER TABLE "WorkflowItemHistory"
ADD CONSTRAINT "WorkflowItemHistory_workflowItemId_fkey"
FOREIGN KEY ("workflowItemId") REFERENCES "WorkflowItem"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkflowItemHistory"
ADD CONSTRAINT "WorkflowItemHistory_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
