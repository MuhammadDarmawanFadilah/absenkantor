package com.shadcn.backend.service;

import com.shadcn.backend.dto.PegawaiCutiRequestDto;
import com.shadcn.backend.dto.PegawaiCutiResponseDto;
import com.shadcn.backend.dto.PegawaiCutiQuotaDto;
import com.shadcn.backend.model.JenisCuti;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.PegawaiCuti;
import com.shadcn.backend.repository.JenisCutiRepository;
import com.shadcn.backend.repository.PegawaiCutiRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.repository.CutiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PegawaiCutiService {
    
    private final PegawaiCutiRepository pegawaiCutiRepository;
    private final PegawaiRepository pegawaiRepository;
    private final JenisCutiRepository jenisCutiRepository;
    private final CutiRepository cutiRepository;
    
    public List<PegawaiCutiResponseDto> getPegawaiCutiByPegawaiId(Long pegawaiId) {
        int currentYear = LocalDate.now().getYear();
        return pegawaiCutiRepository.findPegawaiCutiWithJenisCuti(pegawaiId, currentYear)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<PegawaiCutiResponseDto> getPegawaiCutiByPegawaiIdAndTahun(Long pegawaiId, Integer tahun) {
        return pegawaiCutiRepository.findPegawaiCutiWithJenisCuti(pegawaiId, tahun)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public PegawaiCutiResponseDto createOrUpdatePegawaiCuti(PegawaiCutiRequestDto request) {
        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        // Validate jenis cuti exists
        JenisCuti jenisCuti = jenisCutiRepository.findById(request.getJenisCutiId())
                .orElseThrow(() -> new RuntimeException("Jenis cuti tidak ditemukan"));
        
        // Look for existing record (both active and inactive)
        PegawaiCuti existing = pegawaiCutiRepository.findByPegawaiIdAndJenisCutiIdAndTahun(
                request.getPegawaiId(), request.getJenisCutiId(), request.getTahun()
        ).orElse(null);
        
        PegawaiCuti pegawaiCuti;
        if (existing != null) {
            // Update existing record and reactivate if needed
            existing.setJatahHari(request.getJatahHari());
            existing.setIsActive(true);
            pegawaiCuti = pegawaiCutiRepository.save(existing);
            log.info("Updated pegawai cuti for pegawai {} jenis {}", request.getPegawaiId(), request.getJenisCutiId());
        } else {
            // Create new record
            pegawaiCuti = PegawaiCuti.builder()
                    .pegawai(pegawai)
                    .jenisCuti(jenisCuti)
                    .jatahHari(request.getJatahHari())
                    .tahun(request.getTahun())
                    .isActive(true)
                    .build();
            pegawaiCuti = pegawaiCutiRepository.save(pegawaiCuti);
            log.info("Created new pegawai cuti for pegawai {} jenis {}", request.getPegawaiId(), request.getJenisCutiId());
        }
        
        return convertToDto(pegawaiCuti);
    }
    
    public void deletePegawaiCuti(Long pegawaiId, Long jenisCutiId, Integer tahun) {
        PegawaiCuti pegawaiCuti = pegawaiCutiRepository.findByPegawaiIdAndJenisCutiIdAndTahunAndIsActive(
                pegawaiId, jenisCutiId, tahun, true
        ).orElseThrow(() -> new RuntimeException("Data pegawai cuti tidak ditemukan"));
        
        // Soft delete
        pegawaiCuti.setIsActive(false);
        pegawaiCutiRepository.save(pegawaiCuti);
        
        log.info("Deleted pegawai cuti for pegawai {} jenis {}", pegawaiId, jenisCutiId);
    }
    
    public List<PegawaiCutiQuotaDto> getPegawaiCutiQuota(Long pegawaiId, Integer tahun) {
        List<PegawaiCuti> pegawaiCutis = pegawaiCutiRepository.findPegawaiCutiWithJenisCuti(pegawaiId, tahun);
        
        return pegawaiCutis.stream().map(pc -> {
            // Count used cuti for this jenis and year
            Integer cutiTerpakai = cutiRepository.countApprovedCutiByPegawaiAndJenisCutiAndYear(
                pegawaiId, pc.getJenisCuti().getId(), tahun);
            
            return PegawaiCutiQuotaDto.builder()
                .jenisCutiId(pc.getJenisCuti().getId())
                .jenisCutiNama(pc.getJenisCuti().getNamaCuti())
                .tahun(pc.getTahun())
                .jatahHari(pc.getJatahHari())
                .cutiTerpakai(cutiTerpakai != null ? cutiTerpakai : 0)
                .sisaCuti(pc.getJatahHari() - (cutiTerpakai != null ? cutiTerpakai : 0))
                .build();
        }).collect(Collectors.toList());
    }
    
    public List<PegawaiCutiQuotaDto> getPegawaiCutiQuotaCurrentYear(Long pegawaiId) {
        int currentYear = LocalDate.now().getYear();
        return getPegawaiCutiQuota(pegawaiId, currentYear);
    }
    
    public void savePegawaiCutiList(Long pegawaiId, List<PegawaiCutiRequestDto> cutiList) {
        // Validate pegawai exists
        pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        // Group by year to handle multiple years
        var cutiByYear = cutiList.stream()
                .collect(Collectors.groupingBy(PegawaiCutiRequestDto::getTahun));
        
        for (var entry : cutiByYear.entrySet()) {
            Integer tahun = entry.getKey();
            List<PegawaiCutiRequestDto> cutiForYear = entry.getValue();
            
            // Get existing records for this pegawai and year
            List<PegawaiCuti> existing = pegawaiCutiRepository.findByPegawaiIdAndTahunAndIsActive(pegawaiId, tahun, true);
            
            // Deactivate all existing records first
            for (PegawaiCuti pc : existing) {
                pc.setIsActive(false);
            }
            pegawaiCutiRepository.saveAll(existing);
            
            // Create new records from the list
            for (PegawaiCutiRequestDto dto : cutiForYear) {
                dto.setPegawaiId(pegawaiId);
                dto.setTahun(tahun);
                createOrUpdatePegawaiCuti(dto);
            }
        }
        
        log.info("Saved pegawai cuti list for pegawai {}, total: {}", pegawaiId, cutiList.size());
    }
    
    private PegawaiCutiResponseDto convertToDto(PegawaiCuti pegawaiCuti) {
        return PegawaiCutiResponseDto.builder()
                .id(pegawaiCuti.getId())
                .pegawaiId(pegawaiCuti.getPegawai().getId())
                .namaPegawai(pegawaiCuti.getPegawai().getNamaLengkap())
                .jenisCutiId(pegawaiCuti.getJenisCuti().getId())
                .namaCuti(pegawaiCuti.getJenisCuti().getNamaCuti())
                .jatahHari(pegawaiCuti.getJatahHari())
                .tahun(pegawaiCuti.getTahun())
                .isActive(pegawaiCuti.getIsActive())
                .build();
    }
}
