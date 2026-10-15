CREATE TABLE auth_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(100),
    full_name VARCHAR(150) NOT NULL,
    avatar_url VARCHAR(500),
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(190),
    role VARCHAR(30) NOT NULL DEFAULT 'PATIENT',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_auth_provider (provider, provider_id)
);
