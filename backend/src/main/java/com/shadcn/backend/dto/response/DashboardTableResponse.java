package com.shadcn.backend.dto.response;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class DashboardTableResponse {
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EarlyEmployeeToday {
        private Long pegawaiId;
        private String namaLengkap;
        private String jabatan;
        private LocalTime jamMasuk;
        private String status;
        private String photoUrl;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ExemplaryEmployeeThisMonth {
        private Long pegawaiId;
        private String namaLengkap;
        private String jabatan;
        private Long totalHadirBulan;
        private Double rataRataKedatangan;
        private String tingkatKetepatan;
        private String photoUrl;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EmployeeOnLeaveToday {
        private Long pegawaiId;
        private String namaLengkap;
        private String jabatan;
        private String jenisCuti;
        private LocalDate tanggalMulai;
        private LocalDate tanggalSelesai;
        private String keterangan;
        private String photoUrl;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DashboardTableData {
        private List<EarlyEmployeeToday> pegawaiDatangPagi;
        private List<ExemplaryEmployeeThisMonth> pegawaiTeladan;
        private List<EmployeeOnLeaveToday> pegawaiCuti;
    }
}
