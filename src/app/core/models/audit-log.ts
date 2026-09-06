export interface AuditLogDTO {
  auditLogId: string;
  action: string;
  entityName: string;
  entityReference: string;
  description: string;
  performedByUserName: string;
  createdAt: string;
}
