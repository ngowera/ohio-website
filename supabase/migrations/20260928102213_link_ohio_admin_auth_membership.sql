-- Link Ohio's existing administrator membership to the matching Supabase Auth user.
update public.company_members cm
set user_id = u.id
from auth.users u
where cm.company_id = '0003'
  and lower(cm.email) = lower('johnmwangonde440@gmail.com')
  and lower(u.email) = lower(cm.email)
  and cm.user_id is distinct from u.id;
