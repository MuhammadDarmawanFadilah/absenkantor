package com.shadcn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

@Service
@Slf4j
public class TempFileService {

    @Value("${app.upload.temp-dir:/storage/temp}")
    private String tempUploadDir;

    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /**
     * Clean up temporary files older than specified hours
     */
    public void cleanupOldTempFiles(int hoursOld) {
        try {
            Path tempDir = Paths.get(tempUploadDir);
            if (!Files.exists(tempDir)) {
                return;
            }

            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(hoursOld);

            try (Stream<Path> files = Files.list(tempDir)) {
                List<Path> oldFiles = files
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        try {
                            LocalDateTime fileModTime = LocalDateTime.ofInstant(
                                Files.getLastModifiedTime(path).toInstant(),
                                java.time.ZoneId.systemDefault()
                            );
                            return fileModTime.isBefore(cutoffTime);
                        } catch (IOException e) {
                            log.warn("Could not get modification time for file: {}", path);
                            return false;
                        }
                    })
                    .toList();

                for (Path oldFile : oldFiles) {
                    try {
                        Files.deleteIfExists(oldFile);
                        log.info("Deleted old temp file: {}", oldFile.getFileName());
                    } catch (IOException e) {
                        log.warn("Could not delete old temp file: {}", oldFile.getFileName(), e);
                    }
                }

                if (!oldFiles.isEmpty()) {
                    log.info("Cleaned up {} old temporary files", oldFiles.size());
                }
            }
        } catch (IOException e) {
            log.error("Error during temp file cleanup", e);
        }
    }

    /**
     * Move temporary file to permanent storage
     */
    public String moveTempFileToPermanent(String tempFileName, String permanentDir) throws IOException {
        Path tempFilePath = Paths.get(tempUploadDir).resolve(tempFileName);
        
        if (!Files.exists(tempFilePath)) {
            throw new IOException("Temporary file not found: " + tempFileName);
        }

        // Create permanent directory if it doesn't exist
        Path permanentDirPath = Paths.get(permanentDir);
        if (!Files.exists(permanentDirPath)) {
            Files.createDirectories(permanentDirPath);
        }

        // Move file to permanent location
        Path permanentFilePath = permanentDirPath.resolve(tempFileName);
        Files.move(tempFilePath, permanentFilePath);

        log.info("Moved temp file {} to permanent storage: {}", tempFileName, permanentFilePath);
        return permanentFilePath.toString();
    }

    /**
     * Check if temporary file exists
     */
    public boolean tempFileExists(String fileName) {
        Path filePath = Paths.get(tempUploadDir).resolve(fileName);
        return Files.exists(filePath) && Files.isRegularFile(filePath);
    }

    /**
     * Get temp file path
     */
    public Path getTempFilePath(String fileName) {
        return Paths.get(tempUploadDir).resolve(fileName);
    }

    /**
     * Create temp directory if it doesn't exist
     */
    public void ensureTempDirectoryExists() throws IOException {
        Path tempDir = Paths.get(tempUploadDir);
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
            log.info("Created temp directory: {}", tempDir);
        }
    }
}
