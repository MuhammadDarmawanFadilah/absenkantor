package com.shadcn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class PhotoUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String savePhotoFromBase64(String base64Data, String filename, String subDirectory) {
        try {
            // Remove data:image/jpeg;base64, prefix if present
            String base64Image = base64Data;
            if (base64Data.contains(",")) {
                base64Image = base64Data.split(",")[1];
            }
            
            // Decode base64 to bytes
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            
            return saveFileFromBytes(imageBytes, filename, subDirectory);
            
        } catch (Exception e) {
            log.error("Failed to save photo from base64: {}", filename, e);
            throw new RuntimeException("Failed to save photo: " + e.getMessage());
        }
    }
    
    public String saveFileFromBytes(byte[] fileBytes, String filename, String subDirectory) {
        try {
            // Create upload directory if not exists
            Path uploadPath = createUploadDirectory(subDirectory);
            
            // Generate unique filename
            String fileExtension = getFileExtension(filename);
            String uniqueFilename = generateUniqueFilename(fileExtension);
            
            // Save file
            Path targetPath = uploadPath.resolve(uniqueFilename);
            Files.write(targetPath, fileBytes);
            
            // Set file permissions for web access (666 for maximum compatibility)
            try {
                // For Unix/Linux systems, set powerful file permissions
                if (targetPath.getFileSystem().supportedFileAttributeViews().contains("posix")) {
                    Set<PosixFilePermission> filePermissions = PosixFilePermissions.fromString("rw-rw-rw-");
                    Files.setPosixFilePermissions(targetPath, filePermissions);
                    log.debug("Set POSIX permissions 666 (rw-rw-rw-) for file: {}", uniqueFilename);
                }
            } catch (Exception e) {
                log.warn("Could not set POSIX permissions for file {}: {}", uniqueFilename, e.getMessage());
                // Fallback: try to make file readable/writable via File API
                try {
                    targetPath.toFile().setReadable(true, false);
                    targetPath.toFile().setWritable(true, false);
                    log.debug("Applied fallback permissions using File API for: {}", uniqueFilename);
                } catch (Exception fallbackEx) {
                    log.error("Failed to set any permissions for file {}: {}", uniqueFilename, fallbackEx.getMessage());
                }
            }
            
            log.info("File saved successfully: {} (permissions: rw-rw-rw- with fallback)", targetPath.toString());
            
            // Return relative path for storage in database
            return Paths.get(subDirectory, uniqueFilename).toString().replace("\\", "/");
            
        } catch (IOException e) {
            log.error("Failed to save file from bytes: {}", filename, e);
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }
    
    private Path createUploadDirectory(String subDirectory) throws IOException {
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            
            // Set directory permissions for maximum access (777 for stability)
            try {
                // For Unix/Linux systems, set powerful directory permissions
                if (uploadPath.getFileSystem().supportedFileAttributeViews().contains("posix")) {
                    Set<PosixFilePermission> permissions = PosixFilePermissions.fromString("rwxrwxrwx");
                    Files.setPosixFilePermissions(uploadPath, permissions);
                    log.debug("Set POSIX permissions 777 (rwxrwxrwx) for directory: {}", uploadPath);
                }
            } catch (Exception e) {
                log.warn("Could not set POSIX permissions for directory: {}", e.getMessage());
                // Fallback: try to make directory accessible via File API
                try {
                    uploadPath.toFile().setReadable(true, false);
                    uploadPath.toFile().setWritable(true, false);
                    uploadPath.toFile().setExecutable(true, false);
                    log.debug("Applied fallback permissions using File API for directory: {}", uploadPath);
                } catch (Exception fallbackEx) {
                    log.error("Failed to set any permissions for directory {}: {}", uploadPath, fallbackEx.getMessage());
                }
            }
            
            log.info("Created upload directory: {} (permissions: rwxrwxrwx)", uploadPath.toString());
        }
        
        return uploadPath;
    }
    
    private String generateUniqueFilename(String fileExtension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + fileExtension;
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg"; // Default extension for photos
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
