
INSERT INTO storage.buckets (id, name, public) VALUES ('certifications', 'certifications', true);

CREATE POLICY "Authenticated users can upload certifications"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certifications');

CREATE POLICY "Anyone can view certifications"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certifications');

CREATE POLICY "Users can delete own certifications"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'certifications' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL,
  cover_note text,
  proposed_rate numeric,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can apply to jobs"
ON public.job_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can view own applications"
ON public.job_applications FOR SELECT TO authenticated
USING (auth.uid() = worker_id);

CREATE POLICY "Customers can view applications for their jobs"
ON public.job_applications FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.customer_id = auth.uid()));

CREATE POLICY "Customers can update application status"
ON public.job_applications FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_applications.job_id AND jobs.customer_id = auth.uid()));

CREATE POLICY "Admins can view all applications"
ON public.job_applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all applications"
ON public.job_applications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can delete own pending applications"
ON public.job_applications FOR DELETE TO authenticated
USING (auth.uid() = worker_id AND status = 'pending');

CREATE POLICY "Customers can create payments"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = payer_id);
