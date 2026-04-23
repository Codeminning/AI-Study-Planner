-- Run this in your Supabase SQL Editor to create the necessary tables.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    deadline DATE NOT NULL
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    date DATE NOT NULL,
    duration REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resource_url TEXT
);

-- Insert a default user for local testing purposes
INSERT INTO users (id, name, email) VALUES ('00000000-0000-0000-0000-000000000001', 'Test User', 'dhyaneshvisakan2111@gmail.com') ON CONFLICT DO NOTHING;
