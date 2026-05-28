package com.shadcn.backend.service;

import com.shadcn.backend.dto.response.DashboardTableResponse;
import com.shadcn.backend.repository.AbsensiRepository;
import com.shadcn.backend.repository.CutiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DashboardTableService {

    private final AbsensiRepository absensiRepository;
    private final CutiRepository cutiRepository;

    public DashboardTableResponse.DashboardTableData getDashboardTableData() {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        // 10 pegawai berangkat paling pagi hari ini
        List<DashboardTableResponse.EarlyEmployeeToday> earlyEmployees = getEarlyEmployeesToday(today);

        // 10 pegawai teladan bulan ini (datang paling cepat rata-rata)
        List<DashboardTableResponse.ExemplaryEmployeeThisMonth> exemplaryEmployees = 
                getExemplaryEmployeesThisMonth(startOfMonth, endOfMonth);

        // Pegawai yang cuti hari ini
        List<DashboardTableResponse.EmployeeOnLeaveToday> employeesOnLeave = 
                getEmployeesOnLeaveToday(today);

        return new DashboardTableResponse.DashboardTableData(
                earlyEmployees,
                exemplaryEmployees,
                employeesOnLeave
        );
    }

    private List<DashboardTableResponse.EarlyEmployeeToday> getEarlyEmployeesToday(LocalDate today) {
        return absensiRepository.findTop10EarliestArrivalsToday(today)
                .stream()
                .map(result -> new DashboardTableResponse.EarlyEmployeeToday(
                        (Long) result[0],    // pegawaiId
                        (String) result[1],  // namaLengkap
                        (String) result[2],  // jabatan
                        ((LocalTime) result[3]), // jamMasuk
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
                        (Double) result[4],   // rataRataKedatangan
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