-- Allow Ohio business-loan applications without a business licence while preserving all required identity and collateral images.
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
    or (form_type = 'Business Loan' and jsonb_array_length(document_urls) between 3 and 4)
  )
  and document_urls @> '[{"bucket":"applicant-photos","type":"Applicant Photo"}]'::jsonb
  and document_urls @> '[{"bucket":"national-id-documents","type":"National ID Photo"}]'::jsonb
  and document_urls @> '[{"bucket":"collateral-documents","type":"Collateral Photo"}]'::jsonb
  and (
    form_type = 'Personal Loan'
    or jsonb_array_length(document_urls) = 3
    or document_urls @> '[{"bucket":"business-licences","type":"Business Licence"}]'::jsonb
  )
);
