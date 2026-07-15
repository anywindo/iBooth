ALTER TABLE public.templates 
ADD COLUMN description text,
ADD COLUMN tags text[],
ADD COLUMN theme text,
ADD COLUMN color_style text;
