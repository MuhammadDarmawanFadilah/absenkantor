-- Face Recognition table creation script
-- Run this in your MySQL database to create the face_recognition table

CREATE TABLE IF NOT EXISTS face_recognition (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pegawai_id BIGINT NOT NULL,
    face_encoding LONGTEXT NOT NULL COMMENT 'Base64 encoded face descriptor',
    face_image_url VARCHAR(500) COMMENT 'URL or path to the face image',
    confidence_threshold DECIMAL(5,3) DEFAULT 0.600 COMMENT 'Minimum confidence for face matching (0.000-1.000)',
    training_count INT DEFAULT 1 COMMENT 'Number of training images used',
    is_verified BOOLEAN DEFAULT FALSE COMMENT 'Whether the face recognition has been verified',
    status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE',
    notes TEXT COMMENT 'Additional notes about the face recognition setup',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_face_recognition_pegawai 
        FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint to ensure one face recognition per employee
    UNIQUE KEY uk_face_recognition_pegawai (pegawai_id),
    
    -- Index for better query performance
    INDEX idx_face_recognition_status (status),
    INDEX idx_face_recognition_verified (is_verified),
    INDEX idx_face_recognition_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Store face recognition data for employees';