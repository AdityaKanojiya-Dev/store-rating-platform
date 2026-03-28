-- SQL schema for store rating platform


CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL CHECK (char_length(name) >= 20 AND char_length(name) <= 60),
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    address VARCHAR(400),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- user, admin, store_owner
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    email VARCHAR(100) UNIQUE,
    address VARCHAR(400),
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, store_id)
);

-- Insert demo admin user
-- Password is 'Admin123!' hashed with bcrypt (cost 10): $2a$10$wqQwQwQwQwQwQwQwQwQwQeQwQwQwQwQwQwQwQwQwQwQwQwQwQw
INSERT INTO users (name, email, address, password, role)
VALUES (
    'Demo Admin User For Store Platform',
    'admin@storeplatform.com',
    '123 Admin Street, City, Country',
    '$2b$10$TeUS3C1lQ/JwVKJ4EuSYMu2N4x3X2k0v2rmAqfmEjvBwBrBZvNB7m',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Demo normal user
INSERT INTO users (name, email, address, password, role)
VALUES (
    'Demo Normal User For Store Platform',
    'user1@storeplatform.com',
    '101 User Lane, City, Country',
    '$2b$10$ZYjdNw7iaVFBGwd1t.nyy.1dltgT2dyFc3AcByf9nwYF./c66I41G',
    'user'
)
ON CONFLICT (email) DO NOTHING;

-- Demo store owner
INSERT INTO users (name, email, address, password, role)
VALUES (
    'Demo Store Owner For Store Platform',
    'owner1@storeplatform.com',
    '202 Owner Ave, City, Country',
    '$2b$10$b4uhFZa6XyU/QTYqzKP.MOc.XbD0B/MnEEIkLt1cCk53Y6QstZg3u',
    'store_owner'
)
ON CONFLICT (email) DO NOTHING;

-- Demo normal user 2
INSERT INTO users (name, email, address, password, role)
VALUES (
    'Demo Normal User Two For Store Platform',
    'user2@storeplatform.com',
    '102 User Lane, City, Country',
    '$2b$10$ZYjdNw7iaVFBGwd1t.nyy.1dltgT2dyFc3AcByf9nwYF./c66I41G',
    'user'
)
ON CONFLICT (email) DO NOTHING;
