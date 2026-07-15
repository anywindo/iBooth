INSERT INTO storage.buckets (id, name, public) 
VALUES ('frames', 'frames', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'frames');
CREATE POLICY "Authenticated users can upload frames" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'frames');
CREATE POLICY "Users can update their own frames" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'frames' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own frames" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'frames' AND auth.uid() = owner);
