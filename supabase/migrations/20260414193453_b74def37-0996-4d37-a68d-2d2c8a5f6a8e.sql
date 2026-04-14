
CREATE TABLE public.community_blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  blog_type TEXT NOT NULL DEFAULT 'blog',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view blogs"
  ON public.community_blogs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage blogs"
  ON public.community_blogs FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_community_blogs_updated_at
  BEFORE UPDATE ON public.community_blogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
