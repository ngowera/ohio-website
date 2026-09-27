-- Create Ohio Microfinance Limited and route its public website intake to company 0003.

insert into public.organizations (
  company_id, business_name, area_of_operation, district,
  operator_name, operator_role, company_password,
  created_by_email, official_email
) values (
  '0003', 'Ohio Microfinance Limited',
  'Microfinance lending and website loan applications',
  'Malawi', 'Ohio Administration', 'Administrator',
  gen_random_uuid()::text,
  'ohiomicrofinance40@gmail.com', 'ohiomicrofinance40@gmail.com'
)
on conflict (company_id) do update set
  business_name = excluded.business_name,
  area_of_operation = excluded.area_of_operation,
  district = excluded.district,
  operator_name = excluded.operator_name,
  operator_role = excluded.operator_role,
  created_by_email = excluded.created_by_email,
  official_email = excluded.official_email,
  company_password = coalesce(public.organizations.company_password, excluded.company_password);

insert into public.organization_settings (company_id, organization_name, email)
values ('0003', 'Ohio Microfinance Limited', 'ohiomicrofinance40@gmail.com')
on conflict (company_id) do update set
  organization_name = excluded.organization_name,
  email = excluded.email,
  updated_at = now();

insert into public.loan_settings (company_id, min_loan_amount, max_loan_amount)
values ('0003', 100000, 1000000)
on conflict (company_id) do update set
  min_loan_amount = excluded.min_loan_amount,
  max_loan_amount = excluded.max_loan_amount,
  updated_at = now();

drop policy if exists "Ohio website can submit pending Renmal applications" on public.loan_applications;
drop policy if exists "Ohio website can submit pending applications" on public.loan_applications;
create policy "Ohio website can submit pending applications"
on public.loan_applications for insert to anon
with check (
  company_id = '0003'
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

drop policy if exists "Ohio website can add Renmal document metadata" on public.customer_documents;
drop policy if exists "Ohio website can add application document metadata" on public.customer_documents;
create policy "Ohio website can add application document metadata"
on public.customer_documents for insert to anon
with check (
  company_id = '0003'
  and customer_id is null
  and application_id is not null
  and bucket in ('applicant-photos', 'collateral-documents', 'business-licences')
  and document_type in ('Applicant Photo', 'Collateral Photo', 'Business Licence')
  and file_name like ('0003/' || application_id::text || '/%')
  and file_url like ('https://hycgfmdyujfqfbinsuxx.supabase.co/storage/v1/object/' || bucket || '/0003/' || application_id::text || '/%')
);

drop policy if exists "Ohio website can upload private application images" on storage.objects;
create policy "Ohio website can upload private application images"
on storage.objects for insert to anon
with check (
  bucket_id in ('applicant-photos', 'collateral-documents', 'business-licences')
  and (storage.foldername(name))[1] = '0003'
  and (storage.foldername(name))[2] ~ '^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
