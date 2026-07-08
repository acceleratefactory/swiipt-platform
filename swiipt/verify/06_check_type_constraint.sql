SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'opportunities_type_check';
