-- Usuario app con permisos acotados
CREATE USER iopeer WITH PASSWORD 'iopeer_pwd';
CREATE DATABASE iopeer_dev OWNER iopeer;
GRANT ALL PRIVILEGES ON DATABASE iopeer_dev TO iopeer;

-- Opcional: extensiones comunes
\connect iopeer_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
