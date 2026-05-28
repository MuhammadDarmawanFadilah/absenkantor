package com.shadcn.backend.service;

import com.shadcn.backend.dto.response.DashboardTableResponse;
import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.repository.AbsensiRepository;
import com.shadcn.backend.repository.CutiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardService {

    private final AbsensiRepository absensiRepository;
    private final CutiRepository cutiRepository;

    public DashboardTableResponse.DashboardTableData getDashboardTableData() {
        LocalDate today = LocalDate.now();
        
        // Untuk pegawai teladan bulan ini - ambil dari awal bulan hingga hari ini
        LocalDate startOfCurrentMonth = today.withDayOfMonth(1);
        LocalDate endOfCurrentMonth = today; // Hanya sampai hari ini, bukan sampai akhir bulan

        // 10 pegawai berangkat paling pagi hari ini
        List<DashboardTableResponse.EarlyEmployeeToday> earlyEmployees = getEarlyEmployeesToday(today);

        // 10 pegawai teladan bulan ini (hanya dari 1 hingga 12 Agustus 2025)
        List<DashboardTableResponse.ExemplaryEmployeeThisMonth> exemplaryEmployees = 
                getExemplaryEmployeesThisMonth(startOfCurrentMonth, endOfCurrentMonth);

        // Pegawai yang cuti hari ini
        List<DashboardTableResponse.EmployeeOnLeaveToday> employeesOnLeave = 
                getEmployeesOnLeaveToday(today);

        return new DashboardTableResponse.DashboardTableData(
                earlyEmployees,
                exemplaryEmployees,
                employeesOnLeave
        );
    }

    public Map<String, Object> getDailyAttendanceStats() {
        LocalDate today = LocalDate.now();
        Map<String, Object> stats = new HashMap<>();
        
        // Count pegawai hadir hari ini (yang sudah absen masuk)
        long hadirHariIni = absensiRepository.countByTanggalAndType(today, Absensi.AbsensiType.MASUK);
        
        // Count pegawai terlambat hari ini
        long terlambatHariIni = absensiRepository.countByTanggalAndTypeAndStatus(
            today, Absensi.AbsensiType.MASUK, Absensi.AbsensiStatus.TERLAMBAT);
        
        // Count pegawai cuti hari ini
        long cutiHariIni = cutiRepository.countEmployeesOnLeaveToday(today);
        
        stats.put("hadirHariIni", hadirHariIni);
        stats.put("terlambatHariIni", terlambatHariIni);
        stats.put("cutiHariIni", cutiHariIni);
        
        return stats;
    }

    private List<DashboardTableResponse.EarlyEmployeeToday> getEarlyEmployeesToday(LocalDate today) {
        return absensiRepository.findTop10EarliestArrivalsToday(today)
                .stream()
                .map(result -> new DashboardTableResponse.EarlyEmployeeToday(
                        (Long) result[0],    // pegawaiId
                        (String) result[1],  // namaLengkap
                        (String) result[2],  // jabatan
                        ((java.sql.Time) result[3]).toLocalTime(), // jamMasuk
                        (String) result[4],  // status
                        (String) result[5]   // photoUrl
                ))
                .collect(Collectors.toList());
    }

    private List<DashboardTableResponse.ExemplaryEmployeeThisMonth> getExemplaryEmployeesThisMonth(
            LocalDate startOfMonth, LocalDate endOfMonth) {
        return absensiRepository.findTop10ExemplaryEmployeesThisMonth(startOfMonth, endOfMonth)
                .stream()
                .map(result -> new DashboardTableResponse.ExemplaryEmployeeThisMonth(
                        (Long) result[0],     // pegawaiId
                        (String) result[1],   // namaLengkap
                        (String) result[2],   // jabatan
                        (Long) result[3],     // totalHadirBulan
                        ((java.math.BigDecimal) result[4]).doubleValue(),   // rataRataKedatangan
                        (String) result[5],   // tingkatKetepatan
                        (String) result[6]    // photoUrl
                ))
                .collect(Collectors.toList());
    }

    private List<DashboardTableResponse.EmployeeOnLeaveToday> getEmployeesOnLeaveToday(LocalDate today) {
        return cutiRepository.findEmployeesOnLeaveToday(today)
                .stream()
                .map(result -> new DashboardTableResponse.EmployeeOnLeaveToday(
                        (Long) result[0],     // pegawaiId
                        (String) result[1],   // namaLengkap
                        (String) result[2],   // jabatan
                        (String) result[3],   // jenisCuti
                        ((java.sql.Date) result[4]).toLocalDate(), // tanggalMulai
                        ((java.sql.Date) result[5]).toLocalDate(), // tanggalSelesai
                        (String) result[6],   // keterangan
                        (String) result[7]    // photoUrl
                ))
                .collect(Collectors.toList());
    }
}