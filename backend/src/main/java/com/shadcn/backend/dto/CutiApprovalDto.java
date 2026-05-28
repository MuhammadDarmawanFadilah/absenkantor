package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CutiApprovalDto {
    
    private String statusApproval; // "DIAJUKAN", "DISETUJUI", "DITOLAK"
    private String catatanApproval;
}
