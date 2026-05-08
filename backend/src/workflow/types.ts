export interface WorkflowStepDef {
  key: string;
  nameAr: string;
  /**
   * كود الدور المطلوب لهذه الخطوة (مثل DEAN, VICE_DEAN, FINANCE_MANAGER).
   * إن كان null فالخطوة آلية (auto).
   */
  requiredRole?: string | null;
  /**
   * نوع الـ scope: department | tenant | unit | null
   */
  scope?: 'department' | 'tenant' | 'unit' | null;
  /**
   * شرط منطقي اختياري — يُقيَّم على data الـ instance.
   * مثال: { path: 'amount', op: 'gt', value: 50000 }
   */
  condition?: { path: string; op: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'; value: any } | null;
  /**
   * SLA ساعات
   */
  slaHours?: number;
  /**
   * هل الخطوة بالتوازي مع التي قبلها
   */
  parallel?: boolean;
}

export interface WorkflowDefinitionData {
  steps: WorkflowStepDef[];
}
