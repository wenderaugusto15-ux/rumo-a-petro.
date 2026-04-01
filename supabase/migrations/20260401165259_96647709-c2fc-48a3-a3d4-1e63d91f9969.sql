SELECT cron.schedule(
  'keep-alive-ping',
  '0 6 */4 * *',
  $$
  SELECT net.http_post(
    url := 'https://cyyqtjvwbbktwlxgnkzv.supabase.co/functions/v1/keep-alive',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eXF0anZ3YmJrdHdseGdua3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjI1MjIsImV4cCI6MjA4ODEzODUyMn0.O6sLUeaAiHiRWMxQlwO86g2skIIvzLbUmD1DhoESVLg"}'::jsonb,
    body := '{"time": "now"}'::jsonb
  ) AS request_id;
  $$
);