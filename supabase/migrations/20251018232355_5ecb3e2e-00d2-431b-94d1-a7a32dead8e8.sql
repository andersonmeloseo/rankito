-- Add foreign key relationship between user_subscriptions and profiles
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;