-- Raise the Internal Files bucket from 50 MB to 500 MB.
-- The app rejects larger uploads in INTERNAL_FILES_MAX_BYTES before this bucket does.
-- Safe to re-run: only raises a lower limit.

update storage.buckets
set file_size_limit = 524288000
where id = 'internal-files'
  and (file_size_limit is null or file_size_limit < 524288000);
