package com.shadcn.backend.seeder;

import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.entity.PemotonganAbsen;
import com.shadcn.backend.entity.Shift;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.AbsensiRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.repository.PemotonganAbsenRepository;
import com.shadcn.backend.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
@Order(104) // Run after August seeder
public class AbsensiSeptember2025Seeder implements CommandLineRunner {

    private final AbsensiRepository absensiRepository;
    private final PegawaiRepository pegawaiRepository;
    private final ShiftRepository shiftRepository;
    private final PemotonganAbsenRepository pemotonganAbsenRepository;
    
    @Value("${app.seeder.insert-dummy-data:no}")
    private String insertDummyData;

    @Override
    public void run(String... args) throws Exception {
        log.info("🗓️ Starting Absensi September 2025 Seeder...");
        
        // SAFETY CHECK: Do not run in production environment
        if ("no".equalsIgnoreCase(insertDummyData)) {
            log.info("🛡️ Dummy data insertion is disabled (app.seeder.insert-dummy-data=no). Skipping September 2025 seeder for PRODUCTION safety.");
            return;
        }
        
        log.warn("⚠️ DEVELOPMENT MODE: Running September 2025 seeder with dummy data (app.seeder.insert-dummy-data={})", insertDummyData);
        
        // Check if September 2025 data already exists
        LocalDate septemberStart = LocalDate.of(2025, 9, 1);
        LocalDate septemberEnd = LocalDate.of(2025, 9, 30);
        
        long existingCount = absensiRepository.findByTanggalBetween(septemberStart, septemberEnd).size();
        if (existingCount > 0) {
            log.info("📅 September 2025 absensi data already exists ({} records), skipping seeder...", existingCount);
            return;
        }

        // Get all active employees
        List<Pegawai> pegawaiList = pegawaiRepository.findByIsActive(true);
        if (pegawaiList.isEmpty()) {
            log.warn("⚠️ No active employees found, skipping absensi seeder");
            return;
        }

        // Get default shift (should be shift with ID 1)
        Shift defaultShift = shiftRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default shift not found"));

        Random random = new Random();
        int totalRecords = 0;

        // Generate attendance for September 2025 (weekdays only)
        for (LocalDate date = septemberStart; !date.isAfter(septemberEnd); date = date.plusDays(1)) {
            
            // Skip weekends (Saturday = 6, Sunday = 7)
            if (date.getDayOfWeek().getValue() >= 6) {
                continue;
            }

            for (Pegawai pegawai : pegawaiList) {
                
                // Skip some days randomly to simulate real attendance patterns
                if (random.nextInt(100) < 5) { // 5% chance of being completely absent
                    continue;
                }

                // Generate check-in time with various late scenarios
                LocalTime checkInTime = generateCheckInTime(random, date, pegawai.getId());
                LocalTime checkOutTime = generateCheckOutTime(random, checkInTime, defaultShift);

                // Create check-in record
                if (checkInTime != null) {
                    Absensi absenMasuk = new Absensi();
                    absenMasuk.setPegawai(pegawai);
                    absenMasuk.setTanggal(date);
                    absenMasuk.setType(Absensi.AbsensiType.MASUK);
                    absenMasuk.setWaktu(checkInTime);
                    absenMasuk.setShift(defaultShift);
                    absenMasuk.setStatus(Absensi.AbsensiStatus.HADIR);
                    absenMasuk.setLatitude(-5.3971);
                    absenMasuk.setLongitude(105.2668);
                    absenMasuk.setJarak(50.0);
                    absenMasuk.setKeterangan(generateKeterangan(checkInTime, defaultShift, true));
                    
                    absensiRepository.save(absenMasuk);
                    totalRecords++;
                }

                // Create check-out record
                if (checkOutTime != null) {
                    Absensi absenPulang = new Absensi();
                    absenPulang.setPegawai(pegawai);
                    absenPulang.setTanggal(date);
                    absenPulang.setType(Absensi.AbsensiType.PULANG);
                    absenPulang.setWaktu(checkOutTime);
                    absenPulang.setShift(defaultShift);
                    absenPulang.setStatus(Absensi.AbsensiStatus.HADIR);
                    absenPulang.setLatitude(-5.3971);
                    absenPulang.setLongitude(105.2668);
                    absenPulang.setJarak(45.0);
                    absenPulang.setKeterangan(generateKeterangan(checkOutTime, defaultShift, false));
                    
                    absensiRepository.save(absenPulang);
                    totalRecords++;
                }
            }
        }

        log.info("✅ Generated {} absensi records for September 2025", totalRecords);
        log.info("🎯 Absensi September 2025 Seeder completed successfully!");
    }

    private LocalTime generateCheckInTime(Random random, LocalDate date, Long pegawaiId) {
        // Normal work start time is 08:00
        LocalTime normalStart = LocalTime.of(8, 0);
        
        // Create various scenarios to demonstrate overtime compensation
        int scenario = random.nextInt(100);
        
        if (scenario < 60) {
            // 60% - On time or slightly early (07:45 - 08:00)
            return normalStart.minusMinutes(random.nextInt(16));
            
        } else if (scenario < 75) {
            // 15% - Late 1-30 minutes (no compensation needed, 0% penalty)
            return normalStart.plusMinutes(1 + random.nextInt(30));
            
        } else if (scenario < 90) {
            // 15% - Late 31-90 minutes (compensation eligible)
            int lateMinutes = 31 + random.nextInt(60); // 31-90 minutes
            return normalStart.plusMinutes(lateMinutes);
            
        } else {
            // 10% - Very late (91+ minutes, no compensation possible)
            return normalStart.plusMinutes(91 + random.nextInt(60));
        }
    }

    private LocalTime generateCheckOutTime(Random random, LocalTime checkInTime, Shift shift) {
        if (checkInTime == null) return null;
        
        LocalTime normalEnd = LocalTime.parse(shift.getJamKeluar());
        LocalTime shiftStart = LocalTime.parse(shift.getJamMasuk());
        
        // Calculate how late the employee was
        long lateMinutes = 0;
        if (checkInTime.isAfter(shiftStart)) {
            lateMinutes = java.time.Duration.between(shiftStart, checkInTime).toMinutes();
        }
        
        // If late 31-90 minutes, provide appropriate overtime compensation scenarios
        if (lateMinutes >= 31 && lateMinutes <= 90) {
            // Only compensate for minutes ABOVE 30 (since 0-30 minutes have 0% penalty)
            int compensableLateness = (int) Math.max(0, lateMinutes - 30);
            int requiredOvertime = compensableLateness * 2; // 2x compensation for compensable portion
            
            // 70% chance of full compensation, 20% partial, 10% no compensation
            int compensationScenario = random.nextInt(100);
            
            if (compensationScenario < 70) {
                // Full compensation - work exactly required overtime or more
                int actualOvertime = requiredOvertime + random.nextInt(31); // Extra 0-30 minutes
                return normalEnd.plusMinutes(actualOvertime);
                
            } else if (compensationScenario < 90) {
                // Partial compensation - work less than required
                int actualOvertime = Math.max(0, requiredOvertime - 5 - random.nextInt(10)); // 5-15 minutes short
                return normalEnd.plusMinutes(actualOvertime);
                
            } else {
                // No overtime compensation
                return normalEnd.minusMinutes(random.nextInt(16)); // Leave early or on time
            }
            
        } else {
            // Normal scenarios for non-compensable lateness
            if (random.nextInt(100) < 80) {
                // 80% - Normal departure time (±15 minutes)
                return normalEnd.plusMinutes(random.nextInt(31) - 15);
            } else {
                // 20% - Some overtime (1-60 minutes)
                return normalEnd.plusMinutes(1 + random.nextInt(60));
            }
        }
    }

    private String generateKeterangan(LocalTime time, Shift shift, boolean isCheckIn) {
        if (isCheckIn) {
            LocalTime shiftStart = LocalTime.parse(shift.getJamMasuk());
            if (time.isAfter(shiftStart)) {
                long lateMinutes = java.time.Duration.between(shiftStart, time).toMinutes();
                if (lateMinutes >= 31 && lateMinutes <= 90) {
                    long compensableLateness = lateMinutes - 30; // Only minutes above 30
                    return "Terlambat " + lateMinutes + " menit - " + compensableLateness + " menit dapat dikompensasi dengan " + (compensableLateness * 2) + " menit lembur";
                } else if (lateMinutes > 0) {
                    if (lateMinutes <= 30) {
                        // Get dynamic penalty percentage from database rules
                        BigDecimal penaltyPercentage = getPenaltyPercentageForLateness((int) lateMinutes);
                        return "Terlambat " + lateMinutes + " menit (tidak perlu kompensasi - " + penaltyPercentage + "% potongan)";
                    } else {
                        return "Terlambat " + lateMinutes + " menit (tidak dapat dikompensasi)";
                    }
                }
            }
            return "Masuk normal";
        } else {
            LocalTime shiftEnd = LocalTime.parse(shift.getJamKeluar());
            if (time.isAfter(shiftEnd)) {
                long overtimeMinutes = java.time.Duration.between(shiftEnd, time).toMinutes();
                return "Lembur " + overtimeMinutes + " menit";
            }
            return "Pulang normal";
        }
    }

    /**
     * Get penalty percentage for lateness from database rules
     * @param lateMinutes Minutes of lateness
     * @return Penalty percentage from database or fallback value
     */
    private BigDecimal getPenaltyPercentageForLateness(int lateMinutes) {
        // Get penalty rules from database
        List<PemotonganAbsen> pemotonganRules = pemotonganAbsenRepository.findAllActiveOrderByKode();
        Map<String, BigDecimal> rulePercentages = pemotonganRules.stream()
                .collect(Collectors.toMap(
                        PemotonganAbsen::getKode,
                        PemotonganAbsen::getPersentase
                ));
        
        // Apply same logic as LaporanTukinService
        if (lateMinutes <= 30) {
            return rulePercentages.getOrDefault("TL0", BigDecimal.valueOf(0.00));
        } else if (lateMinutes <= 60) {
            return rulePercentages.getOrDefault("TL1", BigDecimal.valueOf(0.50));
        } else if (lateMinutes <= 90) {
            return rulePercentages.getOrDefault("TL2", BigDecimal.valueOf(1.25));
        } else {
            return rulePercentages.getOrDefault("TL3", BigDecimal.valueOf(2.50));
        }
    }
}
