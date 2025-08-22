CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friendships (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE daily_scores (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    mental_health_score INTEGER CHECK (mental_health_score BETWEEN 0 AND 100),
    PRIMARY KEY (user_id, score_date)
);

CREATE TABLE media_uploads (
    upload_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    local_date DATE NOT NULL
);

CREATE TABLE device_metrics (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    local_date DATE NOT NULL,
    screen_time_minutes INTEGER NOT NULL,  -- Total screen usage time
    unlock_count INTEGER,
    PRIMARY KEY (user_id, local_date)
);

CREATE TABLE location_summary (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    local_date DATE NOT NULL,
    location_variance DOUBLE PRECISION,  -- could represent range or variance of lat/lon
    PRIMARY KEY (user_id, local_date)
);


