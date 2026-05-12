
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'nurse');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'nurse',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users_view_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'Registered Nurse',
  ward TEXT,
  shift TEXT DEFAULT 'Day',
  phone TEXT,
  avatar_url TEXT,
  notif_high_priority BOOLEAN DEFAULT TRUE,
  notif_vitals BOOLEAN DEFAULT TRUE,
  notif_handover BOOLEAN DEFAULT TRUE,
  notif_doctor_reply BOOLEAN DEFAULT TRUE,
  theme_pref TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trigger: auto-create profile + nurse role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'nurse');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  age INT,
  sex TEXT,
  room TEXT,
  ward TEXT,
  diagnosis TEXT,
  allergies TEXT,
  attending_physician TEXT,
  admission_date DATE DEFAULT CURRENT_DATE,
  condition_notes TEXT,
  status TEXT DEFAULT 'stable',
  assigned_nurse_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_all_authenticated" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vitals
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hr INT,
  bp_sys INT,
  bp_dia INT,
  spo2 INT,
  resp_rate INT,
  temp NUMERIC(4,1),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vitals_all_authenticated" ON public.vitals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'vitals',
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_all_authenticated" ON public.reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Handovers
CREATE TABLE public.handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  shift_from TEXT,
  shift_to TEXT,
  narrative TEXT,
  structured JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handovers_all_authenticated" ON public.handovers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Doctor queries
CREATE TABLE public.doctor_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  nurse_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observation TEXT NOT NULL,
  ai_insight TEXT,
  urgency TEXT DEFAULT 'routine',
  status TEXT DEFAULT 'open',
  doctor_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctor_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doctor_queries_all_authenticated" ON public.doctor_queries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT,
  source TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_select_own_or_global" ON public.alerts FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "alerts_insert_authenticated" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alerts_update_own" ON public.alerts FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;

-- Seed demo patients (visible to all authed users)
INSERT INTO public.patients (mrn, full_name, age, sex, room, ward, diagnosis, allergies, attending_physician, condition_notes, status) VALUES
('MRN-1001', 'Eleanor Chen', 68, 'F', '302A', 'Cardiology', 'Acute coronary syndrome, post-PCI day 2', 'Penicillin', 'Dr. Anya Rao', 'Stable. Mild fatigue. Monitor BP trend.', 'stable'),
('MRN-1002', 'Marcus Whitfield', 54, 'M', '305B', 'Cardiology', 'Heart failure exacerbation', 'NKDA', 'Dr. Anya Rao', 'Diuresis ongoing. Daily weights.', 'watch'),
('MRN-1003', 'Priya Natarajan', 41, 'F', '310A', 'General Medicine', 'Community-acquired pneumonia', 'Sulfa drugs', 'Dr. James Okafor', 'On IV ceftriaxone. SpO2 improving.', 'stable'),
('MRN-1004', 'Jonas Bekker', 72, 'M', '312B', 'General Medicine', 'COPD exacerbation', 'NKDA', 'Dr. James Okafor', 'Slight downward trend in SpO2 last 6h.', 'critical'),
('MRN-1005', 'Hana Suzuki', 29, 'F', '208A', 'Post-surgical', 'Post-op appendectomy day 1', 'Latex', 'Dr. Lina Park', 'Pain controlled. Tolerating clear liquids.', 'stable');

-- Seed vitals (a few per patient over the past few hours)
INSERT INTO public.vitals (patient_id, recorded_at, hr, bp_sys, bp_dia, spo2, resp_rate, temp, notes)
SELECT id, now() - interval '6 hours', 78, 128, 82, 97, 16, 36.7, 'Baseline' FROM public.patients WHERE mrn='MRN-1001'
UNION ALL SELECT id, now() - interval '3 hours', 82, 124, 80, 97, 16, 36.8, NULL FROM public.patients WHERE mrn='MRN-1001'
UNION ALL SELECT id, now() - interval '1 hour', 88, 118, 76, 96, 18, 36.9, 'Pt reports mild dizziness' FROM public.patients WHERE mrn='MRN-1001'
UNION ALL SELECT id, now() - interval '4 hours', 92, 142, 88, 94, 22, 37.1, NULL FROM public.patients WHERE mrn='MRN-1002'
UNION ALL SELECT id, now() - interval '1 hour', 96, 138, 86, 93, 24, 37.2, 'Mild SOB on exertion' FROM public.patients WHERE mrn='MRN-1002'
UNION ALL SELECT id, now() - interval '2 hours', 84, 116, 72, 95, 20, 38.1, NULL FROM public.patients WHERE mrn='MRN-1003'
UNION ALL SELECT id, now() - interval '5 hours', 102, 132, 78, 89, 26, 37.6, 'On 2L NC' FROM public.patients WHERE mrn='MRN-1004'
UNION ALL SELECT id, now() - interval '1 hour', 108, 130, 76, 87, 28, 37.8, 'Increased work of breathing' FROM public.patients WHERE mrn='MRN-1004'
UNION ALL SELECT id, now() - interval '3 hours', 76, 118, 72, 99, 14, 36.6, NULL FROM public.patients WHERE mrn='MRN-1005';

-- Seed reminders (some past-due, some upcoming)
INSERT INTO public.reminders (patient_id, type, title, description, due_at, priority, status)
SELECT id, 'vitals', 'Q2H Vitals Check', 'Routine vitals recheck', now() - interval '15 minutes', 'high', 'pending' FROM public.patients WHERE mrn='MRN-1004'
UNION ALL SELECT id, 'medication', 'Furosemide 40mg IV', 'Scheduled dose', now() + interval '20 minutes', 'high', 'pending' FROM public.patients WHERE mrn='MRN-1002'
UNION ALL SELECT id, 'vitals', 'Q4H Vitals', NULL, now() + interval '45 minutes', 'medium', 'pending' FROM public.patients WHERE mrn='MRN-1001'
UNION ALL SELECT id, 'assessment', 'Pain Reassessment', 'Post-op pain score', now() + interval '1 hour', 'medium', 'pending' FROM public.patients WHERE mrn='MRN-1005'
UNION ALL SELECT id, 'medication', 'Ceftriaxone 1g IV', NULL, now() + interval '2 hours', 'medium', 'pending' FROM public.patients WHERE mrn='MRN-1003'
UNION ALL SELECT id, 'vitals', 'Q1H Vitals', 'Critical pt monitoring', now() - interval '5 minutes', 'high', 'pending' FROM public.patients WHERE mrn='MRN-1004';
