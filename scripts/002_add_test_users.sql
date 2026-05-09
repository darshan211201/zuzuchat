-- Add 5 test users to the database
INSERT INTO users (id, email, password) VALUES
  ('user1', 'john.doe@nutritrack.com', 'password123'),
  ('user2', 'jane.smith@nutritrack.com', 'password123'),
  ('user3', 'mike.johnson@nutritrack.com', 'password123'),
  ('user4', 'sarah.williams@nutritrack.com', 'password123'),
  ('user5', 'david.brown@nutritrack.com', 'password123')
ON CONFLICT (id) DO NOTHING;

-- Add sample profiles for these users
INSERT INTO user_profiles (id, email, height, weight, age, gender, activity_level) VALUES
  ('user1', 'john.doe@nutritrack.com', 180, 75, 28, 'male', 'moderate'),
  ('user2', 'jane.smith@nutritrack.com', 165, 60, 25, 'female', 'active'),
  ('user3', 'mike.johnson@nutritrack.com', 175, 85, 35, 'male', 'light'),
  ('user4', 'sarah.williams@nutritrack.com', 170, 68, 30, 'female', 'moderate'),
  ('user5', 'david.brown@nutritrack.com', 182, 90, 40, 'male', 'sedentary')
ON CONFLICT (id) DO NOTHING;
