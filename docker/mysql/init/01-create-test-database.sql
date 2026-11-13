CREATE DATABASE IF NOT EXISTS lanhouse_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON lanhouse_test.* TO 'lanhouse_app'@'%';
