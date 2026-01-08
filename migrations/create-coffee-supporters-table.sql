-- Create Coffee Supporters Table
-- Tracks donations/coffees purchased from supporters

CREATE TABLE IF NOT EXISTS coffee_supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL, -- Amount in dollars
  is_visible BOOLEAN DEFAULT TRUE, -- Allow supporter to hide themselves from public list
  message VARCHAR(500), -- Optional message from supporter
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_coffee_supporters_created_at ON coffee_supporters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coffee_supporters_is_visible ON coffee_supporters(is_visible);
CREATE INDEX IF NOT EXISTS idx_coffee_supporters_amount ON coffee_supporters(amount);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_coffee_supporters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coffee_supporters_updated_at_trigger
BEFORE UPDATE ON coffee_supporters
FOR EACH ROW
EXECUTE FUNCTION update_coffee_supporters_updated_at();

-- Sample data (optional)
-- INSERT INTO coffee_supporters (name, amount, is_visible, message)
-- VALUES ('John', 5.00, true, 'Love this app!');
