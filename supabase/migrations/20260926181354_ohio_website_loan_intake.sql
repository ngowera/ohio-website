-- Ohio website intake for Renmal Capital Limited (company 0001).
-- Existing authenticated organization policies are intentionally left unchanged.

drop policy if exists "website can submit Renmal applications" on public.loan_applications;
drop policy if exists "Ohio website can submit pending Renmal applications" on public.loan_applications;
create policy "Ohio website can submit pending Renmal applications"
on public.loan_applications for insert to anon
with check (
  company_id = '0001'
  and customer_id is null
  and status = 'Pending'
  and form_type in ('Personal Loan', 'Business Loan')
  and amount between 100000 and 1000000
  and loan_amount = amount
  and length(coalesce(full_name, '')) between 2 and 100
  and length(coalesce(phone, '')) between 7 and 25
  and national_id ~ '^[0-9]{8,20}$'
  and length(coalesce(guarantor_name, '')) between 2 and 100
  and length(coalesce(guarantor_phone, '')) between 7 and 25
  and coalesce(form_data->>'source', '') = 'Ohio website'
  and jsonb_typeof(document_urls) = 'array'
  and jsonb_array_length(document_urls) between 2 and 3
);
revoke all on table public.loan_applications from anon;
grant insert (id, company_id, customer_name, full_name, phone, national_id, amount, loan_amount, status, guarantor_name, guarantor_phone, business_name, form_type, form_data, document_urls)
on table public.loan_applications to anon;

drop policy if exists "website can upload Renmal documents" on public.customer_documents;
drop policy if exists "Ohio website can add Renmal document metadata" on public.customer_documents;
create policy "Ohio website can add Renmal document metadata"
on public.customer_documents for insert to anon
with check (
  company_id = '0001'
  and customer_id is null
  and application_id is not null
  and bucket in ('applicant-photos', 'collateral-documents', 'business-licences')
  and document_type in ('Applicant Photo', 'Collateral Photo', 'Business Licence')
  and file_name like ('0001/' || application_id::text || '/%')
  and file_url like ('https://hycgfmdyujfqfbinsuxx.supabase.co/storage/v1/object/' || bucket || '/0001/' || application_id::text || '/%')
);
revoke all on table public.customer_documents from anon;
grant insert (company_id, customer_id, application_id, document_type, bucket, file_name, file_url)
on table public.customer_documents to anon;

drop policy if exists "loan_documents_insert_policy" on storage.objects;
drop policy if exists "authenticated users can upload loan documents" on storage.objects;
drop policy if exists "Ohio website can upload private application images" on storage.objects;
create policy "authenticated users can upload loan documents"
on storage.objects for insert to authenticated
with check (bucket_id = any (array['applicant-photos','national-id-documents','utility-documents','collateral-documents','owner-photos','business-licences','loan-documents','loan-agreements','customer-photos','national_ids','payslips']));
create policy "Ohio website can upload private application images"
on storage.objects for insert to anon
with check (
  bucket_id in ('applicant-photos', 'collateral-documents', 'business-licences')
  and (storage.foldername(name))[1] = '0001'
  and (storage.foldername(name))[2] ~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

-- Apply the user-approved 5 MB limit to every existing organization document bucket.
update storage.buckets
set file_size_limit = 5242880
where id in ('applicant-photos','national-id-documents','utility-documents','collateral-documents','owner-photos','business-licences','loan-documents','loan-agreements','customer-photos','national_ids','payslips');
