-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('passenger', 'driver')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes Table (Bus routes)
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  number VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  waypoints TEXT NOT NULL, -- JSON array of {lat, lng} points
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stops Table (Individual stops along routes)
CREATE TABLE IF NOT EXISTS stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  stop_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active Buses Table (Currently tracking buses)
CREATE TABLE IF NOT EXISTS active_buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  current_lat DECIMAL(10, 8) NOT NULL,
  current_lng DECIMAL(11, 8) NOT NULL,
  avg_speed DECIMAL(5, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  current_stop_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passenger Sessions Table (Tracks which passengers are on which bus)
CREATE TABLE IF NOT EXISTS passenger_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES active_buses(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Seat Reports Table (Crowdsourced seat availability)
CREATE TABLE IF NOT EXISTS seat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES active_buses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('empty', 'standing', 'full')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_routes_number ON routes(number);
CREATE INDEX IF NOT EXISTS idx_stops_route_id ON stops(route_id);
CREATE INDEX IF NOT EXISTS idx_active_buses_route_id ON active_buses(route_id);
CREATE INDEX IF NOT EXISTS idx_active_buses_is_active ON active_buses(is_active);
CREATE INDEX IF NOT EXISTS idx_passenger_sessions_user_id ON passenger_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_passenger_sessions_bus_id ON passenger_sessions(bus_id);
CREATE INDEX IF NOT EXISTS idx_passenger_sessions_is_active ON passenger_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_seat_reports_bus_id ON seat_reports(bus_id);
CREATE INDEX IF NOT EXISTS idx_seat_reports_timestamp ON seat_reports(timestamp);
