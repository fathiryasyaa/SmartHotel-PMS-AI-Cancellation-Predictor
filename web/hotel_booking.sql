-- ============================================================
-- hotel_booking.sql
-- Database Schema untuk Web App Hotel Booking (The Grand Azura)
-- Jalankan file ini di phpMyAdmin XAMPP atau MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS hotel_booking
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hotel_booking;

-- ------------------------------------------------------------
-- 1. Tabel Reservasi (bookings)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id                          VARCHAR(20)    PRIMARY KEY,
    guest_name                  VARCHAR(120)   NOT NULL,
    guest_email                 VARCHAR(150)   NOT NULL DEFAULT '',
    guest_phone                 VARCHAR(30)    NOT NULL DEFAULT '',
    hotel                       VARCHAR(60)    NOT NULL,
    arrival_date_day_of_month   TINYINT        NOT NULL,
    arrival_date_month          VARCHAR(20)    NOT NULL,
    arrival_date_year           SMALLINT       NOT NULL,
    stays_in_week_nights        TINYINT        NOT NULL DEFAULT 0,
    stays_in_weekend_nights     TINYINT        NOT NULL DEFAULT 0,
    adults                      TINYINT        NOT NULL DEFAULT 1,
    children                    TINYINT        NOT NULL DEFAULT 0,
    babies                      TINYINT        NOT NULL DEFAULT 0,
    country                     VARCHAR(10)    NOT NULL DEFAULT 'PRT',
    meal                        VARCHAR(10)    NOT NULL DEFAULT 'BB',
    market_segment              VARCHAR(40)    NOT NULL DEFAULT 'Online TA',
    distribution_channel        VARCHAR(30)    NOT NULL DEFAULT 'TA/TO',
    reserved_room_type          CHAR(1)        NOT NULL DEFAULT 'A',
    deposit_type                VARCHAR(20)    NOT NULL DEFAULT 'No Deposit',
    customer_type               VARCHAR(30)    NOT NULL DEFAULT 'Transient',
    lead_time                   SMALLINT       NOT NULL DEFAULT 0,
    adr                         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    required_car_parking_spaces TINYINT        NOT NULL DEFAULT 0,
    total_of_special_requests   TINYINT        NOT NULL DEFAULT 0,
    -- Hasil prediksi AI
    probability                 DECIMAL(5,2)   NOT NULL,
    prediction                  TINYINT        NOT NULL COMMENT '0=check-out, 1=canceled',
    risk_level                  VARCHAR(10)    NOT NULL COMMENT 'low/medium/high',
    risk_label                  VARCHAR(30)    NOT NULL,
    policy                      VARCHAR(60)    NOT NULL,
    -- Status PMS Operasional Staf
    pms_status                  VARCHAR(20)    NOT NULL DEFAULT 'reserved',
    checkin_at                  DATETIME       NULL DEFAULT NULL,
    checkout_at                 DATETIME       NULL DEFAULT NULL,
    canceled_at                 DATETIME       NULL DEFAULT NULL,
    canceled_by                 VARCHAR(20)    NULL DEFAULT NULL,
    cancel_reason               VARCHAR(255)   NULL DEFAULT NULL,
    -- Audit & Soft-Delete
    created_at                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at                  DATETIME       NULL DEFAULT NULL,
    deleted_by                  VARCHAR(60)    NULL DEFAULT NULL,
    delete_reason               VARCHAR(255)   NULL DEFAULT NULL,

    INDEX idx_risk_level   (risk_level),
    INDEX idx_pms_status   (pms_status),
    INDEX idx_guest_email  (guest_email),
    INDEX idx_guest_phone  (guest_phone),
    INDEX idx_created_at   (created_at),
    INDEX idx_deleted_at   (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Tabel Inventaris & Stok Kamar (room_inventory)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_inventory (
    room_type       CHAR(1)     PRIMARY KEY,
    total_rooms     SMALLINT    NOT NULL DEFAULT 0,
    available_rooms SMALLINT    NOT NULL DEFAULT 0,
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inisialisasi kapasitas stok kamar default
INSERT IGNORE INTO room_inventory (room_type, total_rooms, available_rooms) VALUES
    ('A', 30, 30),
    ('B', 15, 15),
    ('C', 20, 20),
    ('D', 25, 25),
    ('E', 15, 15),
    ('F', 10, 10),
    ('G',  8,  8),
    ('H',  5,  5),
    ('L',  3,  3);
