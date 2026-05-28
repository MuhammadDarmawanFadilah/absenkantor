package com.shadcn.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@Slf4j
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:5MB}")
    private String maxFileSize;

    @PostMapping("/photo")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Map<String, Object>> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageType(contentType)) {
                return ResponseEntity.badRequest().body(createErrorResponse("Invalid file type. Only JPG, PNG, and GIF are allowed"));
            }

            // Validate file size (5MB limit)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(createErrorResponse("File size exceeds 5MB limit"));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, "photos");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                
                // Set directory permissions for web access (755 equivalent)
                try {
                    // For Unix/Linux systems, set proper permissions
                    if (uploadPath.getFileSystem().supportedFileAttributeViews().contains("posix")) {
                        Set<PosixFilePermission> permissions = PosixFilePermissions.fromString("rwxr-xr-x");
                        Files.setPosixFilePermissions(uploadPath, permissions);
                    }
                } catch (Exception e) {
                    log.warn("Could not set POSIX permissions for directory: {}", e.getMessage());
                }
                
                log.info("Created upload directory: {} (absolute: {})", uploadPath, uploadPath.toAbsolutePath());
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String filename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(filename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Set file permissions for web access (644 equivalent)
            try {
                // For Unix/Linux systems, set proper file permissions
                if (filePath.getFileSystem().supportedFileAttributeViews().contains("posix")) {
                    Set<PosixFilePermission> filePermissions = PosixFilePermissions.fromString("rw-r--r--");
                    Files.setPosixFilePermissions(filePath, filePermissions);
                }
            } catch (Exception e) {
                log.warn("Could not set POSIX permissions for file {}: {}", filename, e.getMessage());
            }
            
            log.info("Photo uploaded successfully: {} (size: {} bytes, saved to: {})", 
                    filename, file.getSize(), filePath.toAbsolutePath());

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File uploaded successfully");
            response.put("filename", filename);
            response.put("url", "/api/upload/photos/" + filename);
            response.put("size", file.getSize());
            response.put("contentType", contentType);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading photo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error uploading file: " + e.getMessage()));
        }
    }

    @GetMapping("/photos/{filename}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or hasRole('USER') or hasRole('PEGAWAI')")
      public ResponseEntity<byte[]> getPhoto(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "photos", filename);
            
            if (!Files.exists(filePath)) {
                log.debug("Photo file not found: {}", filename);
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            
            return ResponseEntity.ok()
                    .header("Content-Type", contentType != null ? contentType : "application/octet-stream")
                    .header("Cache-Control", "public, max-age=3600")
                    .header("Access-Control-Allow-Origin", "*")
                    .body(fileContent);

        } catch (IOException e) {
            log.error("Error retrieving photo: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/photos/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deletePhoto(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "photos", filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Files.delete(filePath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Photo deleted successfully");
            
            log.info("Photo deleted successfully: {}", filename);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error deleting photo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error deleting file: " + e.getMessage()));
        }
    }

    private boolean isValidImageType(String contentType) {
        return contentType.equals("image/jpeg") || 
               contentType.equals("image/jpg") || 
               contentType.equals("image/png") || 
               contentType.equals("image/gif");
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}
