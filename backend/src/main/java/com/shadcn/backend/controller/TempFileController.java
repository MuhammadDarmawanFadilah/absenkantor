package com.shadcn.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/temp-files")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${frontend.url}", maxAge = 3600)
public class TempFileController {

    @Value("${app.upload.temp-dir:/storage/temp}")
    private String tempUploadDir;

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadTempFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return createErrorResponse("File tidak boleh kosong", HttpStatus.BAD_REQUEST);
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                return createErrorResponse("Ukuran file melebihi batas maksimum 50MB", HttpStatus.BAD_REQUEST);
            }

            // Create temp directory if it doesn't exist
            Path tempUploadPath = Paths.get(tempUploadDir);
            if (!Files.exists(tempUploadPath)) {
                Files.createDirectories(tempUploadPath);
            }

            // Generate unique filename with date and time
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                originalFilename = "unknown_file";
            }

            // Extract file extension
            String fileExtension = "";
            if (originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // Create filename format: YYYYMMDD_HHMMSS_UUID_originalName
            String dateTime = LocalDateTime.now().format(DATETIME_FORMATTER);
            String uuid = UUID.randomUUID().toString().substring(0, 8); // First 8 chars of UUID
            String baseFileName = originalFilename.substring(0, originalFilename.length() - fileExtension.length());
            String uniqueFilename = String.format("%s_%s_%s%s", dateTime, uuid, baseFileName, fileExtension);

            // Save file
            Path filePath = tempUploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File berhasil diupload");
            response.put("data", Map.of(
                "fileName", uniqueFilename,
                "originalName", originalFilename,
                "size", file.getSize(),
                "mimeType", file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                "uploadedAt", LocalDateTime.now().toString(),
                "previewUrl", "/api/temp-files/preview/" + uniqueFilename,
                "downloadUrl", "/api/temp-files/download/" + uniqueFilename
            ));

            log.info("Temporary file uploaded successfully: {} -> {}", originalFilename, uniqueFilename);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading temporary file", e);
            return createErrorResponse("Gagal menyimpan file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error uploading temporary file", e);
            return createErrorResponse("Terjadi kesalahan tak terduga: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/preview/{fileName}")
    public ResponseEntity<Resource> previewTempFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(tempUploadDir).resolve(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Temp file not found or not readable: {}", fileName);
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            // For preview, use inline disposition for viewable files
            String disposition = "inline";
            if (!isViewableFile(contentType)) {
                disposition = "attachment";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + getOriginalFileName(fileName) + "\"")
                    .body(resource);

        } catch (IOException e) {
            log.error("Error previewing temp file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error previewing temp file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<Resource> downloadTempFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(tempUploadDir).resolve(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("Temp file not found or not readable: {}", fileName);
                return ResponseEntity.notFound().build();
            }

            // Determine content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + getOriginalFileName(fileName) + "\"")
                    .body(resource);

        } catch (IOException e) {
            log.error("Error downloading temp file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error downloading temp file: {}", fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{fileName}")
    public ResponseEntity<Map<String, Object>> deleteTempFile(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(tempUploadDir).resolve(fileName);
            boolean deleted = Files.deleteIfExists(filePath);

            Map<String, Object> response = new HashMap<>();
            if (deleted) {
                response.put("success", true);
                response.put("message", "File berhasil dihapus");
                log.info("Temporary file deleted successfully: {}", fileName);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "File tidak ditemukan");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

        } catch (IOException e) {
            log.error("Error deleting temp file: {}", fileName, e);
            return createErrorResponse("Gagal menghapus file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error deleting temp file: {}", fileName, e);
            return createErrorResponse("Terjadi kesalahan tak terduga: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Map<String, Object>> deleteTempFiles(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> fileNames = (List<String>) request.get("fileNames");
            
            if (fileNames == null || fileNames.isEmpty()) {
                return createErrorResponse("Daftar file tidak boleh kosong", HttpStatus.BAD_REQUEST);
            }

            int deletedCount = 0;
            int totalCount = fileNames.size();
            List<String> failedFiles = new ArrayList<>();

            for (String fileName : fileNames) {
                try {
                    Path filePath = Paths.get(tempUploadDir).resolve(fileName);
                    boolean deleted = Files.deleteIfExists(filePath);
                    if (deleted) {
                        deletedCount++;
                        log.info("Temporary file deleted successfully: {}", fileName);
                    } else {
                        failedFiles.add(fileName + " (tidak ditemukan)");
                    }
                } catch (Exception e) {
                    failedFiles.add(fileName + " (error: " + e.getMessage() + ")");
                    log.error("Error deleting temp file: {}", fileName, e);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Berhasil menghapus %d dari %d file", deletedCount, totalCount));
            response.put("data", Map.of(
                "deletedCount", deletedCount,
                "totalCount", totalCount,
                "failedFiles", failedFiles
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in bulk delete temp files", e);
            return createErrorResponse("Terjadi kesalahan saat menghapus file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupOldTempFiles(@RequestParam(defaultValue = "24") int hoursOld) {
        try {
            Path tempUploadPath = Paths.get(tempUploadDir);
            if (!Files.exists(tempUploadPath)) {
                return createErrorResponse("Direktori temp tidak ditemukan", HttpStatus.NOT_FOUND);
            }

            long cutoffTime = System.currentTimeMillis() - (hoursOld * 60 * 60 * 1000L);
            int deletedCount = 0;
            List<String> deletedFiles = new ArrayList<>();

            try (var stream = Files.list(tempUploadPath)) {
                var oldFiles = stream
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toMillis() < cutoffTime;
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .toList();

                for (Path file : oldFiles) {
                    try {
                        Files.delete(file);
                        deletedFiles.add(file.getFileName().toString());
                        deletedCount++;
                        log.info("Cleaned up old temp file: {}", file.getFileName());
                    } catch (IOException e) {
                        log.error("Error deleting old temp file: {}", file.getFileName(), e);
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Berhasil membersihkan %d file temporary yang lebih dari %d jam", deletedCount, hoursOld));
            response.put("data", Map.of(
                "deletedCount", deletedCount,
                "hoursOld", hoursOld,
                "deletedFiles", deletedFiles
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error cleaning up old temp files", e);
            return createErrorResponse("Terjadi kesalahan saat membersihkan file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/info/{fileName}")
    public ResponseEntity<Map<String, Object>> getTempFileInfo(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(tempUploadDir).resolve(fileName);

            if (!Files.exists(filePath)) {
                return createErrorResponse("File tidak ditemukan", HttpStatus.NOT_FOUND);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", Map.of(
                "fileName", fileName,
                "originalName", getOriginalFileName(fileName),
                "size", Files.size(filePath),
                "mimeType", Files.probeContentType(filePath),
                "lastModified", Files.getLastModifiedTime(filePath).toString(),
                "previewUrl", "/api/temp-files/preview/" + fileName,
                "downloadUrl", "/api/temp-files/download/" + fileName
            ));

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error getting temp file info: {}", fileName, e);
            return createErrorResponse("Gagal mendapatkan informasi file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error getting temp file info: {}", fileName, e);
            return createErrorResponse("Terjadi kesalahan tak terduga: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Utility methods
    private ResponseEntity<Map<String, Object>> createErrorResponse(String message, HttpStatus status) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }

    private boolean isViewableFile(String contentType) {
        return contentType.startsWith("image/") || 
               contentType.equals("application/pdf") ||
               contentType.startsWith("text/") ||
               contentType.startsWith("video/");
    }

    private String getOriginalFileName(String uniqueFileName) {
        // Extract original filename from format: YYYYMMDD_HHMMSS_UUID_originalName.ext
        try {
            String[] parts = uniqueFileName.split("_", 3);
            if (parts.length >= 3) {
                return parts[2]; // Return the originalName.ext part
            }
        } catch (Exception e) {
            log.warn("Could not extract original filename from: {}", uniqueFileName);
        }
        return uniqueFileName; // Fallback to the unique filename
    }
}
