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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${frontend.url}", maxAge = 3600)
public class FileController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/download/{subDir}/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String subDir, @PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir, subDir, fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("File not found or not readable: {}/{}", subDir, fileName);
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
            log.error("Error downloading file: {}/{}", subDir, fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error downloading file: {}/{}", subDir, fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/preview/{subDir}/{fileName}")
    public ResponseEntity<Resource> previewFile(@PathVariable String subDir, @PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir, subDir, fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                log.warn("File not found or not readable: {}/{}", subDir, fileName);
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
            log.error("Error previewing file: {}/{}", subDir, fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("Unexpected error previewing file: {}/{}", subDir, fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/info/{subDir}/{fileName}")
    public ResponseEntity<Map<String, Object>> getFileInfo(@PathVariable String subDir, @PathVariable String fileName) {
        try {
            Path filePath = Paths.get(uploadDir, subDir, fileName);

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
                "previewUrl", "/api/files/preview/" + subDir + "/" + fileName,
                "downloadUrl", "/api/files/download/" + subDir + "/" + fileName
            ));

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error getting file info: {}/{}", subDir, fileName, e);
            return createErrorResponse("Gagal mendapatkan informasi file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error getting file info: {}/{}", subDir, fileName, e);
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
