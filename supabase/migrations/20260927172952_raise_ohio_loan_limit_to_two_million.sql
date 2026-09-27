-- Raise only Ohio Microfinance Limited's public website loan ceiling to MWK 2,000,000.
update public.loan_settings
set
  max_loan_amount = 2000000,
  updated_at = now()
where company_id = '0003';

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
  and length(coalesce(full_name, '')) between 2 and 100
  and length(coalesce(phone, '')) between 7 and 25
  and national_id ~ '^[0-9]{8,20}$'
  and length(coalesce(guarantor_name, '')) between 2 and 100
  and length(coalesce(guarantor_phone, '')) between 7 and 25
  and coalesce(form_data->>'source', '') = 'Ohio website'
  and jsonb_typeof(document_urls) = 'array'
  and jsonb_array_length(document_urls) between 2 and 3
);
