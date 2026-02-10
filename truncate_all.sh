#!/bin/bash
echo "SET FOREIGN_KEY_CHECKS=0;" > /tmp/trunc.sql
mysql -uroot -prootpass123 hms_db -N -e \
  "SELECT CONCAT('TRUNCATE TABLE \`', table_name, '\`;') FROM information_schema.tables WHERE table_schema='hms_db' AND table_type='BASE TABLE' AND table_name != 'alembic_version';" \
  >> /tmp/trunc.sql
echo "SET FOREIGN_KEY_CHECKS=1;" >> /tmp/trunc.sql
mysql -uroot -prootpass123 hms_db < /tmp/trunc.sql
echo "All tables truncated successfully"
