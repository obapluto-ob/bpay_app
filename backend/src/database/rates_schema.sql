-- Create crypto rates table
CREATE TABLE IF NOT EXISTS crypto_rates (
  id SERIAL PRIMARY KEY,
  crypto VARCHAR(10) UNIQUE NOT NULL,
  buy_rate DECIMAL(15,2) NOT NULL,
  sell_rate DECIMAL(15,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Insert default rates
INSERT INTO crypto_rates (crypto, buy_rate, sell_rate) VALUES
('BTC', 45250000, 44750000),
('ETH', 2850000, 2820000),
('USDT', 1580, 1570)
ON CONFLICT (crypto) DO NOTHING;