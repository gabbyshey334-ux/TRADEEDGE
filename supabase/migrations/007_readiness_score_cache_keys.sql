-- Allow per-challenge readiness score cache keys
ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_report_type_check;
ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_report_type_check
  CHECK (
    report_type IN (
      'session',
      'psychology',
      'edge',
      'readiness_score',
      'rule_break_prediction',
      'daily_coaching'
    )
    OR report_type LIKE 'readiness_score_%'
  );
