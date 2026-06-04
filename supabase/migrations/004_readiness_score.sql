-- Allow readiness_score in ai_usage report_type
ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_report_type_check;
ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_report_type_check
  CHECK (report_type IN ('session', 'psychology', 'edge', 'readiness_score'));
