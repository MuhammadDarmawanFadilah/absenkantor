package com.shadcn.backend.service;

import com.shadcn.backend.model.HariLibur;
import com.shadcn.backend.dto.HariLiburRequest;
import com.shadcn.backend.dto.HariLiburResponse;
import com.shadcn.backend.dto.HariLiburApiResponse;
import com.shadcn.backend.repository.HariLiburRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class HariLiburService {

    private final HariLiburRepository hariLiburRepository;
    private final RestTemplate restTemplate;
    private static final String API_HARILIBUR_URL = "https://api-harilibur.vercel.app/api";

    public Page<HariLiburResponse> getAllHariLibur(int page, int size, String namaLibur, Integer tahun, Integer bulan) {
        Pageable pageable = PageRequest.of(page, size);
        Page<HariLibur> hariLiburPage = hariLiburRepository.findWithFilters(namaLibur, tahun, bulan, pageable);
        return hariLiburPage.map(this::mapToResponse);
    }

    public HariLiburResponse getHariLiburById(Long id) {
        HariLibur hariLibur = hariLiburRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hari libur tidak ditemukan dengan ID: " + id));
        return mapToResponse(hariLibur);
    }

    public HariLiburResponse createHariLibur(HariLiburRequest request) {
        // Check if holiday already exists
        if (hariLiburRepository.existsByTanggalLiburAndIsActiveTrue(request.getTanggalLibur())) {
            throw new RuntimeException("Hari libur sudah ada pada tanggal: " + request.getTanggalLibur());
        }

        HariLibur hariLibur = HariLibur.builder()
                .namaLibur(request.getNamaLibur())
                .tanggalLibur(request.getTanggalLibur())
                .isNasional(request.getIsNasional())
                .keterangan(request.getKeterangan())
                .isActive(true)
                .build();

        HariLibur savedHariLibur = hariLiburRepository.save(hariLibur);
        log.info("Hari libur berhasil dibuat: {}", savedHariLibur.getNamaLibur());
        
        return mapToResponse(savedHariLibur);
    }

    public HariLiburResponse updateHariLibur(Long id, HariLiburRequest request) {
        HariLibur existingHariLibur = hariLiburRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hari libur tidak ditemukan dengan ID: " + id));

        // Check if date is being changed and new date already exists
        if (!existingHariLibur.getTanggalLibur().equals(request.getTanggalLibur()) &&
            hariLiburRepository.existsByTanggalLiburAndIsActiveTrue(request.getTanggalLibur())) {
            throw new RuntimeException("Hari libur sudah ada pada tanggal: " + request.getTanggalLibur());
        }

        existingHariLibur.setNamaLibur(request.getNamaLibur());
        existingHariLibur.setTanggalLibur(request.getTanggalLibur());
        existingHariLibur.setIsNasional(request.getIsNasional());
        existingHariLibur.setKeterangan(request.getKeterangan());

        HariLibur updatedHariLibur = hariLiburRepository.save(existingHariLibur);
        log.info("Hari libur berhasil diupdate: {}", updatedHariLibur.getNamaLibur());
        
        return mapToResponse(updatedHariLibur);
    }

    public void deleteHariLibur(Long id) {
        HariLibur hariLibur = hariLiburRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hari libur tidak ditemukan dengan ID: " + id));

        hariLibur.setIsActive(false);
        hariLiburRepository.save(hariLibur);
        
        log.info("Hari libur berhasil dihapus: {}", hariLibur.getNamaLibur());
    }

    @Transactional
    public List<HariLiburResponse> resetHariLiburTahunIni() {
        int currentYear = LocalDate.now().getYear();
        return resetHariLiburByYear(currentYear);
    }

    @Transactional
    public List<HariLiburResponse> resetHariLiburByYear(int year) {
        try {
            log.info("Mengambil data hari libur tahun {} dari API eksternal", year);
            
            // Delete ALL existing holidays for the year (both national and local)
            hariLiburRepository.deleteByTahunLibur(year);
            
            // Get holidays from external API
            String url = API_HARILIBUR_URL + "?year=" + year;
            ResponseEntity<List<HariLiburApiResponse>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<HariLiburApiResponse>>() {}
            );

            List<HariLiburApiResponse> apiHolidays = response.getBody();
            if (apiHolidays == null || apiHolidays.isEmpty()) {
                throw new RuntimeException("Tidak ada data hari libur untuk tahun " + year);
            }
            
            // Convert API response to HariLibur entities
            List<HariLibur> newHolidays = apiHolidays.stream()
                .map(apiHoliday -> {
                    LocalDate holidayDate;
                    try {
                        // Handle different date formats from API
                        String dateStr = apiHoliday.getHoliday_date();
                        if (dateStr.matches("\\d{4}-\\d{1,2}-\\d{1,2}")) {
                            // Format like "2025-9-6" or "2025-09-06"
                            String[] parts = dateStr.split("-");
                            int yearPart = Integer.parseInt(parts[0]);
                            int month = Integer.parseInt(parts[1]);
                            int day = Integer.parseInt(parts[2]);
                            holidayDate = LocalDate.of(yearPart, month, day);
                        } else {
                            // Default format
                            holidayDate = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                        }
                    } catch (Exception e) {
                        log.warn("Failed to parse date: {}, skipping holiday: {}", 
                            apiHoliday.getHoliday_date(), apiHoliday.getHoliday_name());
                        return null;
                    }
                    
                    return HariLibur.builder()
                        .namaLibur(apiHoliday.getHoliday_name())
                        .tanggalLibur(holidayDate)
                        .isNasional(apiHoliday.getIs_national_holiday())
                        .keterangan("Hari libur dari API harilibur tahun " + year)
                        .isActive(true)
                        .build();
                })
                .filter(holiday -> holiday != null) // Remove null entries
                .collect(Collectors.toList());

            // Save new holidays
            List<HariLibur> savedHolidays = hariLiburRepository.saveAll(newHolidays);
            
            // Add weekend holidays (Saturday and Sunday) for the year
            List<HariLibur> weekendHolidays = generateWeekendHolidays(year);
            List<HariLibur> savedWeekendHolidays = hariLiburRepository.saveAll(weekendHolidays);
            
            // Combine both lists for response
            savedHolidays.addAll(savedWeekendHolidays);
            
            log.info("Berhasil menyimpan {} hari libur tahun {} (termasuk {} akhir pekan)", 
                savedHolidays.size(), year, savedWeekendHolidays.size());
            
            return savedHolidays.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            log.error("Error saat mengambil data hari libur dari API: {}", e.getMessage());
            throw new RuntimeException("Gagal mengambil data hari libur: " + e.getMessage());
        }
    }

    public List<HariLiburResponse> getHariLiburByTahun(int tahun) {
        List<HariLibur> hariLiburs = hariLiburRepository.findByTahunLiburAndIsActiveTrueOrderByTanggalLiburAsc(tahun);
        return hariLiburs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<HariLiburResponse> getHariLiburByBulanTahun(int bulan, int tahun) {
        List<HariLibur> hariLiburs = hariLiburRepository.findByBulanLiburAndTahunLiburAndIsActiveTrueOrderByTanggalLiburAsc(bulan, tahun);
        return hariLiburs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public boolean isHariLibur(LocalDate tanggal) {
        return hariLiburRepository.existsByTanggalLiburAndIsActiveTrue(tanggal);
    }

    private List<HariLibur> generateWeekendHolidays(int year) {
        List<HariLibur> weekendHolidays = new java.util.ArrayList<>();
        
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);
        
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
            
            if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
                // Check if this date is not already a national holiday
                if (!hariLiburRepository.existsByTanggalLiburAndIsNasionalTrueAndIsActiveTrue(currentDate)) {
                    String dayName = dayOfWeek == DayOfWeek.SATURDAY ? "Sabtu" : "Minggu";
                    
                    HariLibur weekendHoliday = HariLibur.builder()
                        .namaLibur("Akhir Pekan - " + dayName)
                        .tanggalLibur(currentDate)
                        .isNasional(false)
                        .keterangan("Hari libur akhir pekan")
                        .isActive(true)
                        .build();
                    
                    weekendHolidays.add(weekendHoliday);
                }
            }
            currentDate = currentDate.plusDays(1);
        }
        
        return weekendHolidays;
    }

    private HariLiburResponse mapToResponse(HariLibur hariLibur) {
        return HariLiburResponse.builder()
                .id(hariLibur.getId())
                .namaLibur(hariLibur.getNamaLibur())
                .tanggalLibur(hariLibur.getTanggalLibur())
                .bulanLibur(hariLibur.getBulanLibur())
                .tahunLibur(hariLibur.getTahunLibur())
                .isNasional(hariLibur.getIsNasional())
                .keterangan(hariLibur.getKeterangan())
                .isActive(hariLibur.getIsActive())
                .createdAt(hariLibur.getCreatedAt())
                .updatedAt(hariLibur.getUpdatedAt())
                .build();
    }
}
