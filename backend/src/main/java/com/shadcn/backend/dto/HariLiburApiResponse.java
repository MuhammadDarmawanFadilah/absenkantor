package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@Builder
public class HariLiburApiResponse {
    
    private String holiday_date;
    private String holiday_name;
    private Boolean is_national_holiday;
    
    // Constructor for easier mapping
    public HariLiburApiResponse(String date, String name, Boolean isNational) {
        this.holiday_date = date;
        this.holiday_name = name;
        this.is_national_holiday = isNational;
    }
}
