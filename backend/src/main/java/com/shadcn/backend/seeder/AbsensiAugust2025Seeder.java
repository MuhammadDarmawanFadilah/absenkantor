package com.shadcn.backend.seeder;

import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.entity.Shift;
import com.shadcn.backend.model.Jabatan;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.Lokasi;
import com.shadcn.backend.repository.AbsensiRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.repository.ShiftRepository;
import com.shadcn.backend.repository.JabatanRepository;
import com.shadcn.backend.repository.LokasiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
@Order(10)
public class AbsensiAugust2025Seeder implements CommandLineRunner {

    private final AbsensiRepository absensiRepository;
    private final PegawaiRepository pegawaiRepository;
    private final ShiftRepository shiftRepository;
    private final JabatanRepository jabatanRepository;
    private final LokasiRepository lokasiRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.seeder.absensi.august-2025:no}")
    private String isEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!"yes".equalsIgnoreCase(isEnabled)) {
            log.info("🚫 Absensi August 2025 Seeder is disabled. Skipping...");
            return;
        }

        log.info("🌱 Starting Absensi August 2025 Seeder...");
        
        try {
            // Create additional employees if needed
            createAdditionalEmployees();
            
            // Generate absensi data for August 2025
            generateAbsensiData();
            
            log.info("✅ Absensi August 2025 Seeder completed successfully!");
        } catch (Exception e) {
            log.error("❌ Error during Absensi August 2025 seeding: ", e);
            throw e;
        }
    }

    private void createAdditionalEmployees() {
        log.info("👥 Creating additional employees with complete data...");

        // Check current employee count (excluding admin - ID 1)
        List<Pegawai> allPegawai = pegawaiRepository.findAll();
        long currentCount = allPegawai.stream().filter(p -> p.getId() > 1).count();
        log.info("Current employee count: {}", currentCount);

        if (currentCount >= 10) {
            log.info("✅ Already have {} employees, skipping creation", currentCount);
            return;
        }

        // Create 10 employees with complete data
        EmployeeData[] employeeData = {
            new EmployeeData("Ahmad Kurniawan", "ahmad.k@bawaslu.go.id", "1987-03-15", "LAKI_LAKI", "MENIKAH", 
                "Jl. Teuku Umar No. 45, Enggal, Bandar Lampung", "Lampung", "Bandar Lampung", "Enggal", 
                "35131", "081234567890", "3518234567890123", "Koordinator Hukum", 8500000),
            new EmployeeData("Siti Rahayu", "siti.r@bawaslu.go.id", "1990-08-22", "PEREMPUAN", "MENIKAH", 
                "Jl. Ahmad Yani No. 12, Tanjung Karang Pusat, Bandar Lampung", "Lampung", "Bandar Lampung", "Tanjung Karang Pusat", 
                "35113", "081234567891", "3518234567890124", "Analis Data", 7200000),
            new EmployeeData("Budi Santoso", "budi.s@bawaslu.go.id", "1985-12-10", "LAKI_LAKI", "MENIKAH", 
                "Jl. Kartini No. 88, Gedong Meneng, Bandar Lampung", "Lampung", "Bandar Lampung", "Gedong Meneng", 
                "35145", "081234567892", "3518234567890125", "Supervisor IT", 9200000),
            new EmployeeData("Dewi Permata", "dewi.p@bawaslu.go.id", "1992-06-18", "PEREMPUAN", "BELUM_MENIKAH", 
                "Jl. Raden Intan No. 33, Tanjung Karang Timur, Bandar Lampung", "Lampung", "Bandar Lampung", "Tanjung Karang Timur", 
                "35114", "081234567893", "3518234567890126", "Staff Administrasi", 5800000),
            new EmployeeData("Hendra Wijaya", "hendra.w@bawaslu.go.id", "1988-11-25", "LAKI_LAKI", "MENIKAH", 
                "Jl. Panglima Polim No. 67, Teluk Betung Utara, Bandar Lampung", "Lampung", "Bandar Lampung", "Teluk Betung Utara", 
                "35212", "081234567894", "3518234567890127", "Sekretaris", 7500000),
            new EmployeeData("Sri Mulyani", "sri.m@bawaslu.go.id", "1983-04-07", "PEREMPUAN", "MENIKAH", 
                "Jl. Wolter Monginsidi No. 22, Kemiling, Bandar Lampung", "Lampung", "Bandar Lampung", "Kemiling", 
                "35156", "081234567895", "3518234567890128", "Manager Keuangan", 12000000),
            new EmployeeData("Agus Setiawan", "agus.s@bawaslu.go.id", "1989-09-14", "LAKI_LAKI", "BELUM_MENIKAH", 
                "Jl. Sultan Agung No. 99, Rajabasa, Bandar Lampung", "Lampung", "Bandar Lampung", "Rajabasa", 
                "35144", "081234567896", "3518234567890129", "Teknisi Komputer", 6500000),
            new EmployeeData("Rina Novita", "rina.n@bawaslu.go.id", "1991-01-28", "PEREMPUAN", "MENIKAH", 
                "Jl. Hasanudin No. 55, Teluk Betung Selatan, Bandar Lampung", "Lampung", "Bandar Lampung", "Teluk Betung Selatan", 
                "35221", "081234567897", "3518234567890130", "Staff Hubungan Masyarakat", 6800000),
            new EmployeeData("Doni Pratama", "doni.p@bawaslu.go.id", "1986-07-03", "LAKI_LAKI", "MENIKAH", 
                "Jl. Soekarno Hatta No. 111, Sukarame, Bandar Lampung", "Lampung", "Bandar Lampung", "Sukarame", 
                "35131", "081234567898", "3518234567890131", "Koordinator Lapangan", 8800000),
            new EmployeeData("Maya Sari", "maya.s@bawaslu.go.id", "1993-05-12", "PEREMPUAN", "BELUM_MENIKAH", 
                "Jl. Cut Nyak Dien No. 77, Panjang, Bandar Lampung", "Lampung", "Bandar Lampung", "Panjang", 
                "35241", "081234567899", "3518234567890132", "Analis Kebijakan", 7800000)
        };

        // Get available job positions and office location
        List<Jabatan> availableJabatan = jabatanRepository.findAll().stream()
                .filter(j -> j.getIsActive())
                .collect(Collectors.toList());
        
        Lokasi kantor = lokasiRepository.findByIsActiveTrueOrderByNamaLokasiAsc().stream().findFirst().orElse(null);

        Random random = new Random();

        // Create employees up to 10 total
        int created = 0;
        for (EmployeeData empData : employeeData) {
            if (currentCount + created >= 10) break;

            // Skip if employee already exists
            if (pegawaiRepository.findByEmail(empData.email).isPresent()) {
                log.info("Employee with email {} already exists, skipping creation", empData.email);
                continue;
            }

            Pegawai employee = new Pegawai();
            
            // Basic Information
            employee.setNamaLengkap(empData.nama);
            employee.setEmail(empData.email);
            employee.setPassword(passwordEncoder.encode("password123"));
            employee.setUsername(empData.email.split("@")[0]); // username from email prefix
            
            // Personal Data
            employee.setTanggalLahir(empData.tanggalLahir);
            employee.setJenisKelamin(empData.jenisKelamin);
            employee.setStatusNikah(empData.statusNikah);
            employee.setNoTelp(empData.noTelepon);
            employee.setNip("NIP" + String.format("%06d", 1000 + random.nextInt(9000)));
            
            // Address Information
            employee.setAlamat(empData.alamat);
            employee.setProvinsi(empData.provinsi);
            employee.setKota(empData.kota);
            employee.setKecamatan(empData.kecamatan);
            employee.setKodePos(empData.kodePos);
            
            // Financial Data
            employee.setGajiPokok(empData.gajiPokok.intValue());
            employee.setMakanTransport(500000); // Fixed transport and meal allowance
            employee.setTunjanganTransportasi(400000); // Transport allowance
            employee.setTunjanganKeluarga(empData.statusNikah.equals("MENIKAH") ? 300000 : 0);
            
            // Job Position
            Jabatan jabatan = findJabatanByName(availableJabatan, empData.posisi);
            if (jabatan != null) {
                employee.setJabatan(jabatan);
            } else if (!availableJabatan.isEmpty()) {
                employee.setJabatan(availableJabatan.get(random.nextInt(availableJabatan.size())));
            }
            
            // Office Location
            if (kantor != null) {
                employee.setLokasi(kantor);
            }
            
            // Status and Role
            employee.setIsActive(true);
            employee.setRole("PEGAWAI");
            
            // Timestamps
            employee.setCreatedAt(LocalDateTime.now());
            employee.setUpdatedAt(LocalDateTime.now());
            employee.setTanggalMasuk(LocalDate.now().minusYears(random.nextInt(5) + 1).toString()); // 1-5 years ago

            // Coordinates (around Bandar Lampung with variation)
            employee.setLatitude(-5.39714 + (random.nextGaussian() * 0.01));
            employee.setLongitude(105.266792 + (random.nextGaussian() * 0.01));
            
            // Additional fields
            employee.setPendidikan(random.nextBoolean() ? "S1" : "S2");
            employee.setTempatLahir("Bandar Lampung");

            try {
                Pegawai savedEmployee = pegawaiRepository.save(employee);
                created++;
                log.info("✅ Created employee: {} with job position: {} at salary: {}", 
                    savedEmployee.getNamaLengkap(), 
                    savedEmployee.getJabatan() != null ? savedEmployee.getJabatan().getNama() : "No Position",
                    savedEmployee.getGajiPokok());
            } catch (Exception e) {
                log.error("Failed to create employee {}: {}", empData.nama, e.getMessage());
            }
        }

        log.info("✅ Created {} additional employees with complete data", created);
    }
    
    private Jabatan findJabatanByName(List<Jabatan> jabatanList, String namaJabatan) {
        return jabatanList.stream()
                .filter(j -> j.getNama().toLowerCase().contains(namaJabatan.toLowerCase()) ||
                           namaJabatan.toLowerCase().contains(j.getNama().toLowerCase()))
                .findFirst()
                .orElse(null);
    }
    
    private String getRandomAgama(Random random) {
        String[] agamas = {"Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"};
        return agamas[random.nextInt(agamas.length)];
    }
    
    private String getRandomGolonganDarah(Random random) {
        String[] golDarah = {"A", "B", "AB", "O"};
        return golDarah[random.nextInt(golDarah.length)];
    }

    private void generateAbsensiData() {
        log.info("📅 Generating absensi data for August 2025...");

        // Check if absensi data already exists for August 2025
        LocalDate augustStart = LocalDate.of(2025, Month.AUGUST, 1);
        LocalDate augustEnd = LocalDate.of(2025, Month.AUGUST, 31);
        
        List<Absensi> existingAbsensi = absensiRepository.findByTanggalBetween(augustStart, augustEnd);
        if (!existingAbsensi.isEmpty()) {
            log.info("🗑️ Found {} existing August 2025 records, clearing them first...", existingAbsensi.size());
            absensiRepository.deleteAll(existingAbsensi);
            log.info("✅ Cleared existing August 2025 absensi data");
        }

        // Get all active employees (excluding admin)
        List<Pegawai> allPegawai = pegawaiRepository.findByIsActive(true);
        List<Pegawai> employees = allPegawai.stream().filter(p -> p.getId() > 1).toList();
        List<Shift> shifts = shiftRepository.findByIsActiveTrueOrderByNamaShiftAsc();

        if (employees.isEmpty()) {
            log.warn("❌ No employees found for seeding absensi data");
            return;
        }

        if (shifts.isEmpty()) {
            log.warn("❌ No shifts found for seeding absensi data");
            return;
        }

        log.info("🔄 Generating absensi for {} employees and {} shifts", employees.size(), shifts.size());

        Random random = new Random();
        List<Absensi> absensiList = new ArrayList<>();
        int totalRecords = 0;

        // Generate absensi for each working day in August 2025
        for (LocalDate date = augustStart; !date.isAfter(augustEnd); date = date.plusDays(1)) {
            // Skip weekends (Saturday = 6, Sunday = 7)
            if (date.getDayOfWeek().getValue() >= 6) {
                continue;
            }

            // Simulate some employees taking leave (10% chance per day)
            List<Pegawai> workingEmployees = new ArrayList<>();
            for (Pegawai employee : employees) {
                if (random.nextDouble() > 0.1) { // 90% chance to work
                    workingEmployees.add(employee);
                }
            }

            // Generate absensi for working employees
            for (Pegawai employee : workingEmployees) {
                // Randomly assign shift (weighted towards WFO)
                Shift selectedShift = getRandomShift(shifts, random);
                
                // Generate masuk (check-in) absensi
                Absensi masuk = generateMasukAbsensi(employee, selectedShift, date, random);
                if (masuk != null) {
                    absensiList.add(masuk);
                    totalRecords++;

                    // 95% chance to also have pulang (check-out) if they checked in
                    if (random.nextDouble() < 0.95) {
                        Absensi pulang = generatePulangAbsensi(employee, selectedShift, date, random);
                        if (pulang != null) {
                            absensiList.add(pulang);
                            totalRecords++;
                        }
                    }
                }
            }
        }

        // Save all absensi records in batch
        if (!absensiList.isEmpty()) {
            absensiRepository.saveAll(absensiList);
            log.info("✅ Generated {} absensi records for August 2025", totalRecords);
        } else {
            log.warn("❌ No absensi records generated");
        }
    }

    private Shift getRandomShift(List<Shift> shifts, Random random) {
        // Weight: 60% WFO, 30% WFH, 10% Dinas
        double rand = random.nextDouble();
        if (rand < 0.6) {
            return shifts.stream().filter(s -> "WFO".equals(s.getNamaShift())).findFirst().orElse(shifts.get(0));
        } else if (rand < 0.9) {
            return shifts.stream().filter(s -> "WFH".equals(s.getNamaShift())).findFirst().orElse(shifts.get(0));
        } else {
            return shifts.stream().filter(s -> "Dinas".equals(s.getNamaShift())).findFirst().orElse(shifts.get(0));
        }
    }

    private Absensi generateMasukAbsensi(Pegawai employee, Shift shift, LocalDate date, Random random) {
        try {
            // Parse shift start time
            String[] jamMasukParts = shift.getJamMasuk().split(":");
            LocalTime shiftStartTime = LocalTime.of(Integer.parseInt(jamMasukParts[0]), Integer.parseInt(jamMasukParts[1]));

            // Generate actual check-in time with variation
            LocalTime actualTime = generateCheckInTime(shiftStartTime, random);
            
            // Determine status based on time
            Absensi.AbsensiStatus status;
            String keterangan = null;
            
            if (actualTime.isAfter(shiftStartTime.plusMinutes(30))) {
                status = Absensi.AbsensiStatus.TERLAMBAT;
                long minutesLate = java.time.Duration.between(shiftStartTime, actualTime).toMinutes();
                keterangan = "Terlambat " + minutesLate + " menit";
            } else {
                status = Absensi.AbsensiStatus.HADIR;
            }

            // Generate location (around office or employee home)
            LocationData location = generateLocation(employee, shift, random);

            return new Absensi(
                    null, // ID will be auto-generated
                    employee,
                    shift,
                    Absensi.AbsensiType.MASUK,
                    date,
                    actualTime,
                    location.latitude,
                    location.longitude,
                    location.jarak,
                    generatePhotoUrl(employee, date, "masuk"),
                    status,
                    keterangan,
                    LocalDateTime.of(date, actualTime),
                    LocalDateTime.of(date, actualTime)
            );

        } catch (Exception e) {
            log.error("Error generating masuk absensi for employee {} on {}: ", employee.getId(), date, e);
            return null;
        }
    }

    private Absensi generatePulangAbsensi(Pegawai employee, Shift shift, LocalDate date, Random random) {
        try {
            // Parse shift end time
            String[] jamKeluarParts = shift.getJamKeluar().split(":");
            LocalTime shiftEndTime = LocalTime.of(Integer.parseInt(jamKeluarParts[0]), Integer.parseInt(jamKeluarParts[1]));

            // Generate actual check-out time with variation
            LocalTime actualTime = generateCheckOutTime(shiftEndTime, random);
            
            // Determine status based on time
            Absensi.AbsensiStatus status;
            String keterangan = null;
            
            if (actualTime.isBefore(shiftEndTime.minusMinutes(30))) {
                status = Absensi.AbsensiStatus.PULANG_CEPAT;
                long minutesEarly = java.time.Duration.between(actualTime, shiftEndTime).toMinutes();
                keterangan = "Pulang cepat " + minutesEarly + " menit";
            } else {
                status = Absensi.AbsensiStatus.HADIR;
            }

            // Generate location (around office or employee home)
            LocationData location = generateLocation(employee, shift, random);

            return new Absensi(
                    null, // ID will be auto-generated
                    employee,
                    shift,
                    Absensi.AbsensiType.PULANG,
                    date,
                    actualTime,
                    location.latitude,
                    location.longitude,
                    location.jarak,
                    generatePhotoUrl(employee, date, "pulang"),
                    status,
                    keterangan,
                    LocalDateTime.of(date, actualTime),
                    LocalDateTime.of(date, actualTime)
            );

        } catch (Exception e) {
            log.error("Error generating pulang absensi for employee {} on {}: ", employee.getId(), date, e);
            return null;
        }
    }

    private LocalTime generateCheckInTime(LocalTime shiftStartTime, Random random) {
        // 70% on time or early, 30% late
        if (random.nextDouble() < 0.7) {
            // On time or early (up to 30 minutes early)
            int earlyMinutes = random.nextInt(31); // 0-30 minutes early
            return shiftStartTime.minusMinutes(earlyMinutes);
        } else {
            // Late (1-60 minutes late)
            int lateMinutes = random.nextInt(60) + 1;
            return shiftStartTime.plusMinutes(lateMinutes);
        }
    }

    private LocalTime generateCheckOutTime(LocalTime shiftEndTime, Random random) {
        // 80% on time or late, 20% early
        if (random.nextDouble() < 0.8) {
            // On time or late (up to 60 minutes late)
            int lateMinutes = random.nextInt(61); // 0-60 minutes late
            return shiftEndTime.plusMinutes(lateMinutes);
        } else {
            // Early (15-60 minutes early)
            int earlyMinutes = random.nextInt(46) + 15;
            return shiftEndTime.minusMinutes(earlyMinutes);
        }
    }

    private LocationData generateLocation(Pegawai employee, Shift shift, Random random) {
        // Office coordinates (example: Bandar Lampung city center)
        double officeLat = -5.39714;
        double officeLon = 105.266792;
        double officeRadius = 100.0; // 100 meters

        if ("WFH".equals(shift.getNamaShift())) {
            // Work from home - use employee's home location with some variation
            double homeLat = employee.getLatitude() != null ? employee.getLatitude() : officeLat;
            double homeLon = employee.getLongitude() != null ? employee.getLongitude() : officeLon;
            
            // Add small random variation (within 50 meters)
            double latVariation = (random.nextDouble() - 0.5) * 0.001; // ~50m variation
            double lonVariation = (random.nextDouble() - 0.5) * 0.001;
            
            return new LocationData(
                    homeLat + latVariation,
                    homeLon + lonVariation,
                    random.nextDouble() * 50 // 0-50 meters from home
            );
        } else {
            // WFO or Dinas - around office location
            // Add small random variation within office radius
            double latVariation = (random.nextDouble() - 0.5) * 0.002; // ~100m variation
            double lonVariation = (random.nextDouble() - 0.5) * 0.002;
            
            return new LocationData(
                    officeLat + latVariation,
                    officeLon + lonVariation,
                    random.nextDouble() * officeRadius // 0-100 meters from office
            );
        }
    }

    private String generatePhotoUrl(Pegawai employee, LocalDate date, String type) {
        // Generate a dummy photo URL
        return String.format("photos/absensi/%s_%s_%s_%d.jpg", 
                employee.getUsername(), 
                type, 
                date.toString(), 
                System.currentTimeMillis() % 1000);
    }

    // Helper classes
    private static class EmployeeData {
        final String nama;
        final String email;
        final String tanggalLahir;
        final String jenisKelamin;
        final String statusNikah;
        final String alamat;
        final String provinsi;
        final String kota;
        final String kecamatan;
        final String kodePos;
        final String noTelepon;
        final String nik;
        final String posisi;
        final Double gajiPokok;

        EmployeeData(String nama, String email, String tanggalLahir, String jenisKelamin, String statusNikah,
                    String alamat, String provinsi, String kota, String kecamatan, String kodePos,
                    String noTelepon, String nik, String posisi, double gajiPokok) {
            this.nama = nama;
            this.email = email;
            this.tanggalLahir = tanggalLahir;
            this.jenisKelamin = jenisKelamin;
            this.statusNikah = statusNikah;
            this.alamat = alamat;
            this.provinsi = provinsi;
            this.kota = kota;
            this.kecamatan = kecamatan;
            this.kodePos = kodePos;
            this.noTelepon = noTelepon;
            this.nik = nik;
            this.posisi = posisi;
            this.gajiPokok = gajiPokok;
        }
    }

    private static class LocationData {
        final double latitude;
        final double longitude;
        final double jarak;

        LocationData(double latitude, double longitude, double jarak) {
            this.latitude = latitude;
            this.longitude = longitude;
            this.jarak = jarak;
        }
    }
}
