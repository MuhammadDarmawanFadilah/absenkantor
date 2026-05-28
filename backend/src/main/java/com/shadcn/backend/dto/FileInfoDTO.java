package com.shadcn.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileInfoDTO {
    private String id;
    private String filename;
    private String originalName;
    private long fileSize;
    private String mimeType;
    private String uploadedBy;
    private String uploadedAt;
    private String category;
}
