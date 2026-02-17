# Create database and user
sudo -u postgres psql
CREATE DATABASE kosana_prod;
CREATE USER kosana_app WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE kosana_prod TO kosana_app;

Result:
aiinspection@aiinspection-HP:~/Documents/KosAna$ sudo -u postgres psql
[sudo] password for aiinspection: 
psql (16.11 (Ubuntu 16.11-0ubuntu0.24.04.1))
Type "help" for help.

postgres=# CREATE DATABASE kosana_prod;
CREATE DATABASE
postgres=# CREATE USER kosana_app WITH ENCRYPTED PASSWORD 'strong_password';
CREATE ROLE
postgres=# GRANT ALL PRIVILEGES ON DATABASE kosana_prod TO kosana_app;
GRANT
postgres=# 

-------------------------