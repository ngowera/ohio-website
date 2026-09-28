-- Require a National ID photo instead of a typed National ID number for Ohio website applications.
drop policy if exists "Ohio website can submit pending applications" on public.loan_applications;
create policy "Ohio website can submit pending applications"
on public.loan_applications for insert to anon
with check (
  company_id = '0003'
  and customer_id is null
  and status = 'Pending'
  and form_type in ('Personal Loan', 'Business Loan')
  and amount between 100000 and 2000000
  and loan_amount = amount
  and national_id is null
  and length(coalesce(full_name, '')) between 2 and 100
  and length(coalesce(phone, '')) between 7 and 25
  and length(coalesce(guarantor_name, '')) between 2 and 100
  and length(coalesce(guarantor_phone, '')) between 7 and 25
  and coalesce(form_data->>'source', '') = 'Ohio website'
  and coalesce(form_data->>'nationalIdPhotoProvided', 'false') = 'true'
  and jsonb_typeof(document_urls) = 'array'
  and (
    (form_type = 'Personal Loan' and jsonb_array_length(document_urls) = 3)
    or (form_type = 'Business Loan' and jsonb_array_length(document_urls) = 4)
  )
  and document_urls @> '[{"bucket":"applicant-photos","type":"Applicant Photo"}]'::jsonb
  and document_urls @> '[{"bucket":"national-id-documents","type":"National ID Photo"}]'::jsonb
  and document_urls @> '[{"bucket":"collateral-documents","type":"Collateral Photo"}]'::jsonb
  and (
    form_type = 'Personal Loan'
    or document_urls @> '[{"bucket":"business-licences","type":"Business Licence"}]'::jsonb
  )
);

drop policy if exists "Ohio website can add application document metadata" on public.customer_documents;
create policy "Ohio website can add application document metadata"
on public.customer_documents for insert to anon
with check (
  company_id = '0003'
  and customer_id is null
  and application_id is not null
  and bucket in ('applicant-photos', 'national-id-documents', 'collateral-documents', 'business-licences')
  and document_type in ('Applicant Photo', 'National ID Photo', 'Collateral Photo', 'Business Licence')
  and file_name like ('0003/' || application_id::text || '/%')
  and file_url like ('https://hycgfmdyujfqfbinsuxx.supabase.co/storage/v1/object/' || bucket || '/0003/' || application_id::text || '/%')
);

drop policy if exists "Ohio website can upload private application images" on storage.objects;
create policy "Ohio website can upload private application images"
on storage.objects for insert to anon
with check (
  bucket_id in ('applicant-photos', 'national-id-documents', 'collateral-documents', 'business-licences')
  and (storage.foldername(name))[1] = '0003'
  and (storage.foldername(name))[2] ~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
