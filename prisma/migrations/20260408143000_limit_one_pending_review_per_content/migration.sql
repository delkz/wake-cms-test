CREATE UNIQUE INDEX "WorkflowItem_one_pending_review_per_content"
ON "WorkflowItem" ("targetEntityId")
WHERE
  "entityType" = 'CONTENT'
  AND "status" = 'PENDING_REVIEW'
  AND "targetEntityId" IS NOT NULL;
