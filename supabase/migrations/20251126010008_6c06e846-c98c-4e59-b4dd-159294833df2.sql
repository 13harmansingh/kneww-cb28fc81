-- Add filtering fields to bookmarks table
ALTER TABLE bookmarks 
ADD COLUMN country TEXT,
ADD COLUMN category TEXT,
ADD COLUMN language TEXT;