-- ============================================================
-- hotel_booking.sql
-- Jalankan di phpMyAdmin XAMPP atau MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS hotel_booking
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hotel_booking;

CREATE TABLE IF NOT EXISTS bookings (
    id                          VARCHAR(20)    PRIMARY KEY,
    guest_name                  VARCHAR(120)   NOT NULL,
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
    -- Audit
    created_at                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at                  DATETIME       NULL DEFAULT NULL,
    deleted_by                  VARCHAR(60)    NULL DEFAULT NULL,
    delete_reason               VARCHAR(255)   NULL DEFAULT NULL,

    INDEX idx_risk_level  (risk_level),
    INDEX idx_created_at  (created_at),
    INDEX idx_deleted_at  (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
