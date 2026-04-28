-- Author: Daniel Yu
-- Date: 2026-03-18
-- Description: SQL schema for VANTAGE game database.
--              Contains tables: players (email, birth_date) and results (id, email, date_played, total_time, total_stars).
--              Includes sample data for at least five players.

-- Players table
CREATE TABLE IF NOT EXISTS players (
    email VARCHAR(255) PRIMARY KEY,
    birth_date DATE NOT NULL
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    date_played DATETIME NOT NULL,
    total_time FLOAT NOT NULL,
    total_stars INT NOT NULL,
    FOREIGN KEY (email) REFERENCES players(email) ON DELETE CASCADE
);

-- Sample data
INSERT INTO players (email, birth_date) VALUES
('player1@example.com', '1990-01-01'),
('player2@example.com', '1991-02-02'),
('player3@example.com', '1992-03-03'),
('player4@example.com', '1993-04-04'),
('player5@example.com', '1994-05-05');

-- Sample results
INSERT INTO results (email, date_played, total_time, total_stars) VALUES
('player1@example.com', NOW(), 45.2, 7),
('player2@example.com', NOW(), 38.5, 8),
('player3@example.com', NOW(), 52.0, 6),
('player4@example.com', NOW(), 29.8, 9),
('player5@example.com', NOW(), 47.1, 7),
('player1@example.com', NOW() - INTERVAL 1 DAY, 42.3, 8),
('player2@example.com', NOW() - INTERVAL 2 DAY, 40.1, 7);