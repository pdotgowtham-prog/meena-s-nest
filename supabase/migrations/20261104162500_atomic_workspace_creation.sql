create or replace function public.create_workspace(p_name text) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_uid uuid:=auth.uid(); v_workspace_id uuid; v_name text:=trim(coalesce(p_name,''));
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 if char_length(v_name)<2 or char_length(v_name)>80 then raise exception 'Workspace name must be between 2 and 80 characters'; end if;
 insert into public.workspaces(name,owner_user_id,created_by) values(v_name,v_uid,v_uid) returning id into v_workspace_id;
 insert into public.workspace_members(workspace_id,user_id,role,created_by) values(v_workspace_id,v_uid,'owner',v_uid);
 return v_workspace_id;
end; $$;
revoke all on function public.create_workspace(text) from public,anon;
grant execute on function public.create_workspace(text) to authenticated;
