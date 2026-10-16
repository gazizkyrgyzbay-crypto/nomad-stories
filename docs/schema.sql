-- PostgreSQL schema sketch. This is NOT a deployed migration.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TYPE booking_status AS ENUM ('hold','pending_payment','confirmed','checked_in','checked_out','cancelled','expired');
CREATE TABLE properties (
 id uuid PRIMARY KEY,
 location_id uuid NOT NULL,
 code text NOT NULL,
 title text NOT NULL,
 capacity integer NOT NULL CHECK (capacity>0)
);
CREATE TABLE bookings (
 id uuid PRIMARY KEY,
 property_id uuid NOT NULL REFERENCES properties(id),
 check_in date NOT NULL,
 check_out date NOT NULL,
 status booking_status NOT NULL,
 expires_at timestamptz,
 price_kzt bigint NOT NULL CHECK(price_kzt>=0),
 guests integer NOT NULL CHECK(guests>0),
 CHECK(check_out>check_in),
 EXCLUDE USING gist (
  property_id WITH =,
  daterange(check_in,check_out,'[)') WITH &&
 ) WHERE (status IN ('hold','pending_payment','confirmed','checked_in'))
);
-- Expired holds require a reliable worker to change status; expiry must be
-- coordinated with provider-confirmed payment callbacks transactionally.
-- Maintenance blocks need the SAME inventory concurrency protection.
