package com.shadcn.backend.service;

import com.shadcn.backend.dto.FileInfoDTO;
import org.springframework.stereotype.Service;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.UUID;
import java.io.File;

@Service
public class FileService {

    private static final Logger logger = LoggerFactory.getLogger(FileService.class);

    @Value("${app.upload.document-dir:backend/backend/storage/documents}")
    private String documentsPath;

    @Value("${app.upload.temp-dir:backend/backend/storage/temp}")
    private String tempUploadDir;

    public List<FileInfoDTO> getUserFiles(String username) {
        try {
            Path userPath = Paths.get(documentsPath);
            if (!Files.exists(userPath)) {
                return new ArrayList<>();
            }

            return Files.list(userPath)
                    .filter(Files::isRegularFile)
                    .map(this::mapToFileInfo)
                    .filter(file -> file != null && username.equals(file.getUploadedBy()))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("Error getting user files for: {}", username, e);
            return new ArrayList<>();
        }
    }

    public List<FileInfoDTO> getAllFiles() {
        try {
            Path uploadsPath = Paths.get(documentsPath);
            if (!Files.exists(uploadsPath)) {
                return new ArrayList<>();
            }

            return Files.list(uploadsPath)
                    .filter(Files::isRegularFile)
                    .map(this::mapToFileInfo)
                    .filter(file -> file != null)
                    .collect(Collectors.toList());
        } catch (IOException e) {
            logger.error("Error getting all files", e);
            return new ArrayList<>();
        }
    }

    public Resource downloadFile(String filename, String username) throws Exception {
        Path filePath = Paths.get(documentsPath, filename);
        
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File not found: " + filename);
        }

        return new FileSystemResource(filePath.toFile());
    }

    public boolean deleteFile(String fileId, String username) {
        try {
            // In a real implementation, you would map fileId to actual filename
            // For now, treating fileId as filename
            Path filePath = Paths.get(documentsPath, fileId);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                logger.info("File deleted: {} by user: {}", fileId, username);
                return true;
            }
            return false;
        } catch (IOException e) {
            logger.error("Error deleting file: {} by user: {}", fileId, username, e);
            return false;
        }
    }

    public Map<String, Object> uploadFromTemp(String title, String description, String tempFileName, String kategoriId, String username) {
        try {
            // Get temp file path using configured directory
            Path tempFilePath = Paths.get(tempUploadDir, tempFileName);
            
            if (!Files.exists(tempFilePath)) {
                throw new RuntimeException("File temporary tidak ditemukan: " + tempFileName);
            }

            // Generate new filename with user prefix
            String originalName = tempFileName;
            String extension = "";
            int lastDot = originalName.lastIndexOf('.');
            if (lastDot > 0) {
                extension = originalName.substring(lastDot);
            }
            
            String newFileName = username + "_" + UUID.randomUUID().toString() + extension;
            
            // Ensure documents directory exists
            Path documentsDir = Paths.get(documentsPath);
            if (!Files.exists(documentsDir)) {
                Files.createDirectories(documentsDir);
            }
            
            // Copy file to permanent storage
            Path targetPath = documentsDir.resolve(newFileName);
            Files.copy(tempFilePath, targetPath);
            
            // Delete temp file
            Files.deleteIfExists(tempFilePath);
            
            // Get file info
            File movedFile = targetPath.toFile();
            String fileType = Files.probeContentType(targetPath);
            if (fileType == null) {
                fileType = determineMimeType(newFileName);
            }
            
            // Create file info DTO
            FileInfoDTO fileInfo = FileInfoDTO.builder()
                    .id(newFileName)
                    .filename(newFileName)
                    .originalName(originalName)
                    .fileSize(movedFile.length())
                    .mimeType(fileType)
                    .uploadedBy(username)
                    .uploadedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .category(kategoriId != null ? kategoriId : "document")
                    .build();
            
            return Map.of(
                    "success", true,
                    "message", "File berhasil disimpan",
                    "file", fileInfo
            );
            
        } catch (Exception e) {
            logger.error("Error uploading from temp: {}", e.getMessage(), e);
            throw new RuntimeException("Gagal memindahkan file: " + e.getMessage());
        }
    }

    private FileInfoDTO mapToFileInfo(Path filePath) {
        try {
            BasicFileAttributes attrs = Files.readAttributes(filePath, BasicFileAttributes.class);
            String filename = filePath.getFileName().toString();
            
            // Extract username from filename (format: username_uuid.extension)
            String uploadedBy = "system";
            if (filename.contains("_")) {
                uploadedBy = filename.substring(0, filename.indexOf("_"));
            }
            
            return FileInfoDTO.builder()
                    .id(filename) // Using filename as ID for simplicity
                    .filename(filename)
                    .originalName(filename)
                    .fileSize(attrs.size())
                    .mimeType(determineMimeType(filename))
                    .uploadedBy(uploadedBy)
                    .uploadedAt(LocalDateTime.ofInstant(attrs.creationTime().toInstant(), ZoneId.systemDefault())
                            .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .category("document")
                    .build();
        } catch (IOException e) {
            logger.error("Error mapping file to DTO: {}", filePath, e);
            return null;
        }
    }

    private String determineMimeType(String filename) {
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        switch (extension) {
            case "pdf":
                return "application/pdf";
            case "doc":
            case "docx":
                return "application/msword";
            case "xls":
            case "xlsx":
                return "application/vnd.ms-excel";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "txt":
                return "text/plain";
            default:
                return "application/octet-stream";
        }
    }
}
