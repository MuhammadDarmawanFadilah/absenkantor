package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceTopKRequest {
    private double[] faceDescriptor;
    private Integer k;
}
