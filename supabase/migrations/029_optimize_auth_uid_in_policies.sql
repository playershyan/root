-- 029_optimize_auth_uid_in_policies.sql
-- Replace raw auth.uid() in policy expressions with (select auth.uid())
-- to avoid initplan performance issues. Idempotent and dynamic.

BEGIN;

DO $$
DECLARE
  rec RECORD;
  v_schema text;
  v_table text;
  v_policy text;
  v_cmd text;
  v_as text := '';
  v_roles text := '';
  v_using text;
  v_check text;
  v_using_new text;
  v_check_new text;
  v_sql text;
  v_roles_list text;
  updated_count int := 0;
  action_char char;
BEGIN
  FOR rec IN (
    SELECT
      pn.nspname AS schemaname,
      pc.relname AS tablename,
      pp.polname AS policyname,
      pp.polpermissive AS permissive,
      pp.polroles AS roles,
      pp.polcmd AS cmd,
      pg_get_expr(pp.polqual, pp.polrelid) AS using_expr,
      pg_get_expr(pp.polwithcheck, pp.polrelid) AS check_expr
    FROM pg_policy pp
    JOIN pg_class pc ON pp.polrelid = pc.oid
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND (
        (pp.polqual IS NOT NULL AND pg_get_expr(pp.polqual, pp.polrelid) LIKE '%auth.uid()%'
          AND pg_get_expr(pp.polqual, pp.polrelid) NOT LIKE '%(select auth.uid())%')
        OR
        (pp.polwithcheck IS NOT NULL AND pg_get_expr(pp.polwithcheck, pp.polrelid) LIKE '%auth.uid()%'
          AND pg_get_expr(pp.polwithcheck, pp.polrelid) NOT LIKE '%(select auth.uid())%')
      )
  ) LOOP
    v_schema := rec.schemaname;
    v_table := rec.tablename;
    v_policy := rec.policyname;
    action_char := rec.cmd;

    -- Determine action text
    v_cmd := CASE action_char
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END;

    -- Permissive / Restrictive
    v_as := CASE WHEN rec.permissive IS FALSE THEN ' AS RESTRICTIVE' ELSE '' END;

    -- Roles clause
    SELECT CASE WHEN array_length(rec.roles,1) IS NULL THEN NULL ELSE
      array_to_string(
        ARRAY(
          SELECT quote_ident(r.rolname)
          FROM pg_roles r
          WHERE r.oid = ANY(rec.roles)
          ORDER BY r.rolname
        ), ', '
      ) END
    INTO v_roles_list;

    v_roles := CASE WHEN v_roles_list IS NULL THEN '' ELSE ' TO ' || v_roles_list END;

    -- Build updated USING / CHECK expressions
    v_using := rec.using_expr;
    v_check := rec.check_expr;

    IF v_using IS NOT NULL THEN
      v_using_new := replace(v_using, 'auth.uid()', '(select auth.uid())');
    ELSE
      v_using_new := NULL;
    END IF;

    IF v_check IS NOT NULL THEN
      v_check_new := replace(v_check, 'auth.uid()', '(select auth.uid())');
    ELSE
      v_check_new := NULL;
    END IF;

    -- Drop and recreate policy with updated expressions
    v_sql := format('DROP POLICY IF EXISTS %I ON %I.%I;', v_policy, v_schema, v_table);
    EXECUTE v_sql;

    v_sql := format('CREATE POLICY %I ON %I.%I%s FOR %s%s',
      v_policy, v_schema, v_table, v_as, v_cmd, v_roles);

    IF v_using_new IS NOT NULL THEN
      v_sql := v_sql || ' USING (' || v_using_new || ')';
    END IF;

    IF v_check_new IS NOT NULL THEN
      v_sql := v_sql || ' WITH CHECK (' || v_check_new || ')';
    END IF;

    v_sql := v_sql || ';';
    EXECUTE v_sql;

    updated_count := updated_count + 1;
  END LOOP;

  RAISE NOTICE 'Policies updated with optimized auth.uid(): %', updated_count;
END $$;

COMMIT;

