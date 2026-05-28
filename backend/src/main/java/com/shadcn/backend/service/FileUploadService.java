package com.shadcn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:10485760}") // 10MB default
    private long maxFileSize;

    /**
     * Upload file to storage directory
     *
     * @param file        The multipart file to upload
     * @param subDirectory Sub directory for organization (e.g., "laporan", "documents")
     * @return String path of the uploaded file
     */
    public String uploadFile(MultipartFile file, String subDirectory) {
        try {
            // Validate file
            validateFile(file);

            // Create upload directory if not exists
            Path uploadPath = createUploadDirectory(subDirectory);

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = generateUniqueFilename(fileExtension);

            // Save file
            Path targetPath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File uploaded successfully: {}", targetPath.toString());

            // Return relative path for storage in database
            return Paths.get(subDirectory, uniqueFilename).toString().replace("\\", "/");

        } catch (IOException e) {
            log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Delete file from storage
     *
     * @param filePath The relative file path to delete
     * @return true if deleted successfully, false otherwise
     */
    public boolean deleteFile(String filePath) {
        try {
            Path fullPath = Paths.get(uploadDir, filePath);
            boolean deleted = Files.deleteIfExists(fullPath);
            
            if (deleted) {
                log.info("File deleted successfully: {}", fullPath.toString());
            } else {
                log.warn("File not found for deletion: {}", fullPath.toString());
            }
            
            return deleted;
        } catch (IOException e) {
            log.error("Failed to delete file: {}", filePath, e);
            return false;
        }
    }

    /**
     * Get full path of uploaded file
     *
     * @param relativePath The relative path stored in database
     * @return Path object representing the full file path
     */
    public Path getFilePath(String relativePath) {
        return Paths.get(uploadDir, relativePath);
    }

    /**
     * Check if file exists
     *
     * @param relativePath The relative path to check
     * @return true if file exists, false otherwise
     */
    public boolean fileExists(String relativePath) {
        Path fullPath = getFilePath(relativePath);
        return Files.exists(fullPath);
    }

    /**
     * Get file size
     *
     * @param relativePath The relative path
     * @return file size in bytes, -1 if file doesn't exist
     */
    public long getFileSize(String relativePath) {
        try {
            Path fullPath = getFilePath(relativePath);
            if (Files.exists(fullPath)) {
                return Files.size(fullPath);
            }
            return -1;
        } catch (IOException e) {
            log.error("Failed to get file size: {}", relativePath, e);
            return -1;
        }
    }

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new RuntimeException("File size exceeds maximum allowed size of " + 
                formatFileSize(maxFileSize));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }

        // Check for directory traversal attempts
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new RuntimeException("Invalid filename: contains illegal characters");
        }
    }

    /**
     * Create upload directory if not exists
     */
    private Path createUploadDirectory(String subDirectory) throws IOException {
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath.toString());
        }
        
        return uploadPath;
    }

    /**
     * Generate unique filename with timestamp and UUID
     */
    private String generateUniqueFilename(String fileExtension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + fileExtension;
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * Format file size for human reading
     */
    private String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.1f MB", size / (1024.0 * 1024));
        return String.format("%.1f GB", size / (1024.0 * 1024 * 1024));
    }

    /**
     * Get allowed file types for validation
     */
    public boolean isFileTypeAllowed(String filename, String[] allowedTypes) {
        if (allowedTypes == null || allowedTypes.length == 0) {
            return true; // No restrictions
        }

        String fileExtension = getFileExtension(filename).toLowerCase().substring(1); // Remove the dot
        
        for (String allowedType : allowedTypes) {
            if (allowedType.equals("*") || allowedType.toLowerCase().equals(fileExtension)) {
                return true;
            }
            
            // Handle MIME type categories
            String detectedType = getFileTypeCategory(fileExtension);
            if (allowedType.toLowerCase().equals(detectedType)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get file type category from extension
     */
    private String getFileTypeCategory(String extension) {
        return switch (extension.toLowerCase()) {
            case "jpg", "jpeg", "png", "gif", "bmp", "webp" -> "image";
            case "mp4", "avi", "mov", "wmv", "flv", "webm", "mkv" -> "video";
            case "mp3", "wav", "flac", "aac", "ogg" -> "audio";
            case "pdf" -> "pdf";
            case "doc", "docx" -> "word";
            case "xls", "xlsx" -> "excel";
            case "ppt", "pptx" -> "powerpoint";
            case "txt" -> "text";
            case "zip", "rar", "7z" -> "archive";
            default -> "unknown";
        };
    }
}
