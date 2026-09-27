-- Keep Ohio Microfinance Limited's public and server-side contact email aligned.
update public.organizations
set
  official_email = 'ohiomicrofinance@gmail.com',
  created_by_email = case
    when created_by_email = 'ohiomicrofinance40@gmail.com'
      then 'ohiomicrofinance@gmail.com'
    else created_by_email
  end
where company_id = '0003';

update public.organization_settings
set
  email = 'ohiomicrofinance@gmail.com',
  updated_at = now()
where company_id = '0003';
