begin;

create or replace function public.sync_wanted_request_active_state()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.status, 'pending') = 'active' then
    new.is_active := true;
  else
    new.is_active := false;
  end if;

  return new;
end;
$$;

drop trigger if exists wanted_requests_status_active_insert_trigger on public.wanted_requests;
drop trigger if exists wanted_requests_status_active_update_trigger on public.wanted_requests;

create trigger wanted_requests_status_active_insert_trigger
before insert on public.wanted_requests
for each row
execute function public.sync_wanted_request_active_state();

create trigger wanted_requests_status_active_update_trigger
before update on public.wanted_requests
for each row
when (new.status is distinct from old.status)
execute function public.sync_wanted_request_active_state();

update public.wanted_requests
set is_active = (status = 'active');

commit;

