-- Least-privilege account for the web application (run once as an admin; change the password!)
CREATE USER IF NOT EXISTS 'autocare_app'@'localhost' IDENTIFIED BY 'change_me';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON AutoCareDB.* TO 'autocare_app'@'localhost';
FLUSH PRIVILEGES;
