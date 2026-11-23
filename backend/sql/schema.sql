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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT NULL,
    short_description VARCHAR(255) DEFAULT NULL,
    description TEXT,
    image VARCHAR(255) DEFAULT NULL,
    service_fee DECIMAL(12,2) DEFAULT NULL,
    fee_currency CHAR(3) NOT NULL DEFAULT 'USD',
    translations TEXT DEFAULT NULL,        -- optional Russian/Chinese text as JSON
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    service_id INT DEFAULT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) DEFAULT NULL,
    message TEXT,
    inquiry_type ENUM('general', 'consultation', 'research') NOT NULL DEFAULT 'general',
    country_interest VARCHAR(100) DEFAULT NULL,
    status ENUM('new', 'contacted', 'closed') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_inquiries_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS universities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    description TEXT,
    -- Tuition fee (per year): one amount, a range, words only, or not set ("fee on request").
    -- fee_text may be added to any mode and is shown next to the numbers.
    fee_mode ENUM('none', 'single', 'range', 'text') NOT NULL DEFAULT 'none',
    tuition_fee DECIMAL(12,2) DEFAULT NULL,          -- the amount, or the lowest amount of a range
    tuition_fee_max DECIMAL(12,2) DEFAULT NULL,      -- the highest amount of a range
    fee_currency CHAR(3) NOT NULL DEFAULT 'USD',     -- USD, EUR, CNY, PKR, INR, RUB, TRY or GBP
    fee_text VARCHAR(255) DEFAULT NULL,
    -- Scholarship option of the university
    scholarship_type ENUM('none', 'full', 'partial', 'institutional') NOT NULL DEFAULT 'none',
    scholarship_source ENUM('none', 'government', 'institution') NOT NULL DEFAULT 'none',
    languages VARCHAR(20) NOT NULL DEFAULT 'en',     -- teaching languages, comma list of en, ru, zh
    ranking INT DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    intake VARCHAR(100) DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    translations TEXT DEFAULT NULL,                  -- optional Russian/Chinese text as JSON
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_universities_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT NULL,
    university_id INT DEFAULT NULL,
    scholarship_type ENUM('full', 'partial', 'institutional') NOT NULL,   -- fully funded / partially funded / institutional
    funding_source ENUM('government', 'institution') NOT NULL,            -- government-based / institution-based
    level ENUM('any', 'bachelor', 'master', 'phd') NOT NULL DEFAULT 'any',
    languages VARCHAR(20) NOT NULL DEFAULT 'en',                          -- comma list of en, ru, zh
    summary VARCHAR(500) DEFAULT NULL,
    funding_details TEXT,                                                 -- keeps the admin's line breaks and "- " bullets
    deadline DATE DEFAULT NULL,
    website VARCHAR(255) DEFAULT NULL,
    image VARCHAR(255) DEFAULT NULL,
    translations TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_scholarships_country (country),
    CONSTRAINT fk_scholarships_university FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tour_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    destination VARCHAR(150) DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    duration_days INT DEFAULT NULL,
    price DECIMAL(12,2) DEFAULT NULL,
    price_currency CHAR(3) NOT NULL DEFAULT 'USD',
    price_note VARCHAR(255) DEFAULT NULL,                -- e.g. "per person"
    short_description VARCHAR(255) DEFAULT NULL,
    description TEXT,
    transport VARCHAR(40) NOT NULL DEFAULT '',           -- comma list of plane, train, car, bus, boat (may be empty)
    image VARCHAR(255) DEFAULT NULL,
    translations TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotels of a tour package: none, one or many. People per room is one value (min = max) or a range.
CREATE TABLE IF NOT EXISTS tour_package_hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100) DEFAULT NULL,
    stars TINYINT UNSIGNED DEFAULT NULL,
    people_per_room_min TINYINT UNSIGNED NOT NULL,
    people_per_room_max TINYINT UNSIGNED NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_hotels_package FOREIGN KEY (package_id) REFERENCES tour_packages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    translations TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT DEFAULT NULL,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    translations TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_faqs_category FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Which pages a question is shown on (home, about, services, education-scholarships, tour-packages, research-support, contact)
CREATE TABLE IF NOT EXISTS faq_pages (
    faq_id INT NOT NULL,
    page_key VARCHAR(40) NOT NULL,
    PRIMARY KEY (faq_id, page_key),
    CONSTRAINT fk_faq_pages_faq FOREIGN KEY (faq_id) REFERENCES faqs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    status ENUM('subscribed', 'unsubscribed') NOT NULL DEFAULT 'subscribed',
    source VARCHAR(50) NOT NULL DEFAULT 'website',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Currency display options edited in Admin > Settings (enabled currencies, default currency, symbol/text/both)
CREATE TABLE IF NOT EXISTS site_settings (
    key_name VARCHAR(60) PRIMARY KEY,
    value TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Starter universities. Only name, country, city and official website are filled in.
-- Add fees, scholarship options, rankings, intakes and descriptions from each university's official
-- website via Admin > Universities. Delete or hide any you do not work with.
INSERT IGNORE INTO universities (name, slug, country, city, website) VALUES
('University of Oxford', 'university-of-oxford', 'United Kingdom', 'Oxford', 'https://www.ox.ac.uk/'),
('University of Cambridge', 'university-of-cambridge', 'United Kingdom', 'Cambridge', 'https://www.cam.ac.uk/'),
('Imperial College London', 'imperial-college-london', 'United Kingdom', 'London', 'https://www.imperial.ac.uk/'),
('University College London', 'university-college-london', 'United Kingdom', 'London', 'https://www.ucl.ac.uk/'),
('University of Manchester', 'university-of-manchester', 'United Kingdom', 'Manchester', 'https://www.manchester.ac.uk/'),
('University of Edinburgh', 'university-of-edinburgh', 'United Kingdom', 'Edinburgh', 'https://www.ed.ac.uk/'),
('University of Toronto', 'university-of-toronto', 'Canada', 'Toronto', 'https://www.utoronto.ca/'),
('University of British Columbia', 'university-of-british-columbia', 'Canada', 'Vancouver', 'https://www.ubc.ca/'),
('McGill University', 'mcgill-university', 'Canada', 'Montreal', 'https://www.mcgill.ca/'),
('University of Waterloo', 'university-of-waterloo', 'Canada', 'Waterloo', 'https://uwaterloo.ca/'),
('University of Alberta', 'university-of-alberta', 'Canada', 'Edmonton', 'https://www.ualberta.ca/'),
('University of Melbourne', 'university-of-melbourne', 'Australia', 'Melbourne', 'https://www.unimelb.edu.au/'),
('University of Sydney', 'university-of-sydney', 'Australia', 'Sydney', 'https://www.sydney.edu.au/'),
('UNSW Sydney', 'unsw-sydney', 'Australia', 'Sydney', 'https://www.unsw.edu.au/'),
('Australian National University', 'australian-national-university', 'Australia', 'Canberra', 'https://www.anu.edu.au/'),
('Monash University', 'monash-university', 'Australia', 'Melbourne', 'https://www.monash.edu/'),
('Massachusetts Institute of Technology', 'massachusetts-institute-of-technology', 'United States', 'Cambridge', 'https://www.mit.edu/'),
('Stanford University', 'stanford-university', 'United States', 'Stanford', 'https://www.stanford.edu/'),
('Harvard University', 'harvard-university', 'United States', 'Cambridge', 'https://www.harvard.edu/'),
('University of California, Berkeley', 'university-of-california-berkeley', 'United States', 'Berkeley', 'https://www.berkeley.edu/');

-- To create your first admin account:
--   1. Register a normal account from the website
--   2. Then run: UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
