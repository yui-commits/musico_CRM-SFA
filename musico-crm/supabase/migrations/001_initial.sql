-- MUSICO CRM/SFA Initial Schema

CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(50),
  prefecture VARCHAR(10) NOT NULL,
  municipality VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  email VARCHAR(255),
  website_url TEXT,
  key_person_name VARCHAR(100),
  capacity INT,
  existing_classes VARCHAR(255),
  features TEXT,
  ai_sales_script TEXT,
  lead_status VARCHAR(50) NOT NULL DEFAULT '未着手',
  deal_status VARCHAR(50),
  appointment_date TIMESTAMPTZ,
  appointment_method VARCHAR(50),
  outreach_type VARCHAR(50),
  required_instructors INT,
  trial_date TIMESTAMPTZ,
  flyer_delivery_method VARCHAR(50),
  application_deadline DATE,
  trial_applicants INT,
  enrollment_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  sales_person VARCHAR(100) NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_name VARCHAR(100),
  call_status VARCHAR(50) NOT NULL,
  ng_reason VARCHAR(50),
  note TEXT,
  next_action VARCHAR(100),
  next_action_date TIMESTAMPTZ
);

CREATE INDEX idx_activities_facility_id ON activities(facility_id);
CREATE INDEX idx_activities_called_at ON activities(called_at);
CREATE INDEX idx_facilities_lead_status ON facilities(lead_status);
CREATE INDEX idx_facilities_deal_status ON facilities(deal_status);
CREATE INDEX idx_facilities_phone ON facilities(phone_number);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
