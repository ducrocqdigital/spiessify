CREATE TABLE public.checkin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion text NOT NULL,
  reference_time timestamptz NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.checkin_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.checkin_sessions(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  check_time timestamptz NOT NULL DEFAULT now(),
  minutes_late integer NOT NULL DEFAULT 0,
  is_on_time boolean NOT NULL DEFAULT true,
  penalty_id uuid REFERENCES public.penalties(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, member_id)
);

CREATE UNIQUE INDEX one_active_checkin_session ON public.checkin_sessions (is_active) WHERE is_active;

ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage checkin sessions"
  ON public.checkin_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can manage checkin results"
  ON public.checkin_results FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
