-- LN PAK website database schema (same schema used by the Node/Express API)
-- Import this file first (via phpMyAdmin, MySQL Workbench, or `mysql -u user -p < schema.sql`)

CREATE DATABASE IF NOT EXISTS lnpak_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lnpak_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT NULL,
    short_description VARCHAR(255) DEFAULT NULL,
    description TEXT,
    image VARCHAR(255) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    message TEXT,
    status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inquiries_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO services (title, slug, country, short_description, description, image) VALUES
('Study in the UK', 'study-in-uk', 'United Kingdom',
 'Undergraduate & postgraduate admissions across top UK universities.',
 'We guide students through UK university selection, application, visa filing (CAS, financial evidence, TB test guidance) and pre-departure briefing. Partnered with a wide network of UK institutions.',
 NULL),
('Study in Canada', 'study-in-canada', 'Canada',
 'College & university placement plus study permit support.',
 'End-to-end support for Canadian study permits, DLI college/university selection, SOP writing help, and GIC/financial documentation guidance.',
 NULL),
('Study in Australia', 'study-in-australia', 'Australia',
 'University placement and student visa (subclass 500) guidance.',
 'We help students shortlist Australian universities, prepare COE documentation, and navigate the GTE statement and visa interview process.',
 NULL),
('Study in the USA', 'study-in-usa', 'United States',
 'F-1 visa guidance and university/college admissions support.',
 'Support with SEVIS/I-20 processing, university shortlisting, SOP and LOR review, and F-1 visa interview preparation.',
 NULL);

-- To create your first admin account:
--   1. Register a normal account from the website
--   2. Then run: UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
