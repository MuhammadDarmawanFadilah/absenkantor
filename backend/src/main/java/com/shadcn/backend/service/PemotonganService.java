package com.shadcn.backend.service;

import com.shadcn.backend.model.Pemotongan;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.dto.PemotonganRequest;
import com.shadcn.backend.dto.PemotonganResponse;
import com.shadcn.backend.repository.PemotonganRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PemotonganService {

    private final PemotonganRepository pemotonganRepository;
    private final PegawaiRepository pegawaiRepository;

    public Page<PemotonganResponse> getAllPemotongan(int page, int size, String namaPegawai, Integer bulan, Integer tahun) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Pemotongan> pemotonganPage = pemotonganRepository.findWithFilters(namaPegawai, bulan, tahun, pageable);
        return pemotonganPage.map(this::mapToResponse);
    }

    public PemotonganResponse getPemotonganById(Long id) {
        Pemotongan pemotongan = pemotonganRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan tidak ditemukan dengan ID: " + id));
        return mapToResponse(pemotongan);
    }

    public PemotonganResponse createPemotongan(PemotonganRequest request) {
        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan dengan ID: " + request.getPegawaiId()));

        // Check if pemotongan already exists for this pegawai in the same month/year
        if (pemotonganRepository.existsByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
                request.getPegawaiId(), request.getBulanPemotongan(), request.getTahunPemotongan())) {
            throw new RuntimeException("Pemotongan untuk pegawai ini pada bulan " + getMonthName(request.getBulanPemotongan()) + 
                " " + request.getTahunPemotongan() + " sudah ada");
        }

        Pemotongan pemotongan = Pemotongan.builder()
                .pegawai(pegawai)
                .bulanPemotongan(request.getBulanPemotongan())
                .tahunPemotongan(request.getTahunPemotongan())
                .persentasePemotongan(request.getPersentasePemotongan())
                .alasanPemotongan(request.getAlasanPemotongan())
                .tunjanganKinerja(request.getTunjanganKinerja())
                .isActive(true)
                .build();

        Pemotongan savedPemotongan = pemotonganRepository.save(pemotongan);
        log.info("Pemotongan berhasil dibuat untuk pegawai: {} pada periode: {}/{}", 
            pegawai.getNamaLengkap(), request.getBulanPemotongan(), request.getTahunPemotongan());
        
        return mapToResponse(savedPemotongan);
    }

    public PemotonganResponse updatePemotongan(Long id, PemotonganRequest request) {
        Pemotongan existingPemotongan = pemotonganRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan tidak ditemukan dengan ID: " + id));

        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan dengan ID: " + request.getPegawaiId()));

        // Check if changing to different pegawai/month/year and if it already exists
        if (!existingPemotongan.getPegawai().getId().equals(request.getPegawaiId()) ||
            !existingPemotongan.getBulanPemotongan().equals(request.getBulanPemotongan()) ||
            !existingPemotongan.getTahunPemotongan().equals(request.getTahunPemotongan())) {
            
            if (pemotonganRepository.existsByPegawaiIdAndBulanPemotonganAndTahunPemotonganAndIsActiveTrue(
                    request.getPegawaiId(), request.getBulanPemotongan(), request.getTahunPemotongan())) {
                throw new RuntimeException("Pemotongan untuk pegawai ini pada bulan " + getMonthName(request.getBulanPemotongan()) + 
                    " " + request.getTahunPemotongan() + " sudah ada");
            }
        }

        existingPemotongan.setPegawai(pegawai);
        existingPemotongan.setBulanPemotongan(request.getBulanPemotongan());
        existingPemotongan.setTahunPemotongan(request.getTahunPemotongan());
        existingPemotongan.setPersentasePemotongan(request.getPersentasePemotongan());
        existingPemotongan.setAlasanPemotongan(request.getAlasanPemotongan());
        existingPemotongan.setTunjanganKinerja(request.getTunjanganKinerja());

        Pemotongan updatedPemotongan = pemotonganRepository.save(existingPemotongan);
        log.info("Pemotongan berhasil diupdate untuk pegawai: {} pada periode: {}/{}", 
            pegawai.getNamaLengkap(), request.getBulanPemotongan(), request.getTahunPemotongan());
        
        return mapToResponse(updatedPemotongan);
    }

    public void deletePemotongan(Long id) {
        Pemotongan pemotongan = pemotonganRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan tidak ditemukan dengan ID: " + id));

        pemotongan.setIsActive(false);
        pemotonganRepository.save(pemotongan);
        
        log.info("Pemotongan berhasil dihapus untuk pegawai: {} pada periode: {}/{}", 
            pemotongan.getPegawai().getNamaLengkap(), 
            pemotongan.getBulanPemotongan(), 
            pemotongan.getTahunPemotongan());
    }

    public List<PemotonganResponse> getPemotonganByPegawai(Long pegawaiId) {
        List<Pemotongan> pemotongans = pemotonganRepository
            .findByPegawaiIdAndIsActiveTrueOrderByTahunPemotonganDescBulanPemotonganDesc(pegawaiId);
        return pemotongans.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PemotonganResponse> getPemotonganByPeriode(Integer bulan, Integer tahun) {
        List<Pemotongan> pemotongans = pemotonganRepository
            .findByBulanPemotonganAndTahunPemotonganAndIsActiveTrueOrderByCreatedAtDesc(bulan, tahun);
        return pemotongans.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private PemotonganResponse mapToResponse(Pemotongan pemotongan) {
        return PemotonganResponse.builder()
                .id(pemotongan.getId())
                .pegawaiId(pemotongan.getPegawai().getId())
                .namaPegawai(pemotongan.getPegawai().getNamaLengkap())
                .nip(pemotongan.getPegawai().getNip())
                .jabatan(pemotongan.getPegawai().getJabatan() != null ? 
                    pemotongan.getPegawai().getJabatan().getNama() : null)
                .bulanPemotongan(pemotongan.getBulanPemotongan())
                .tahunPemotongan(pemotongan.getTahunPemotongan())
                .persentasePemotongan(pemotongan.getPersentasePemotongan())
                .alasanPemotongan(pemotongan.getAlasanPemotongan())
                .nominalPemotongan(pemotongan.getNominalPemotongan())
                .tunjanganKinerja(pemotongan.getTunjanganKinerja())
                .isActive(pemotongan.getIsActive())
                .createdAt(pemotongan.getCreatedAt())
                .updatedAt(pemotongan.getUpdatedAt())
                .build();
    }

    private String getMonthName(Integer month) {
        if (month == null) return null;
        
        String[] months = {
            "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        };
        
        return month >= 1 && month <= 12 ? months[month] : month.toString();
    }
}
