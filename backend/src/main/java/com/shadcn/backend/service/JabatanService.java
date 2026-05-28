package com.shadcn.backend.service;

import com.shadcn.backend.model.Jabatan;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.dto.JabatanRequest;
import com.shadcn.backend.dto.JabatanResponse;
import com.shadcn.backend.repository.JabatanRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JabatanService {
    
    private final JabatanRepository jabatanRepository;
    private final PegawaiRepository pegawaiRepository;
    
    public Page<JabatanResponse> getAllJabatanPaged(String search, int page, int size, String sortBy, String sortDirection) {
        try {
            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Sort sort = Sort.by(direction, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Jabatan> jabatanPage = jabatanRepository.findBySearchTerm(search, pageable);
            return jabatanPage.map(JabatanResponse::from);
        } catch (Exception e) {
            log.error("Error fetching jabatan with pagination: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch jabatan data: " + e.getMessage());
        }
    }
    
    public List<Jabatan> getAllActiveJabatan() {
        try {
            return jabatanRepository.findByIsActiveTrueOrderByNamaAsc();
        } catch (Exception e) {
            log.error("Error fetching active jabatan: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch active jabatan: " + e.getMessage());
        }
    }
    
    public List<Jabatan> getAllJabatan() {
        try {
            return jabatanRepository.findAllByOrderByNamaAsc();
        } catch (Exception e) {
            log.error("Error fetching all jabatan: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch jabatan data: " + e.getMessage());
        }
    }
    
    public Optional<JabatanResponse> getJabatanById(Long id) {
        try {
            return jabatanRepository.findById(id).map(JabatanResponse::from);
        } catch (Exception e) {
            log.error("Error fetching jabatan by id {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to fetch jabatan: " + e.getMessage());
        }
    }
    
    public Optional<Jabatan> getJabatanByNama(String nama) {
        try {
            return jabatanRepository.findByNamaIgnoreCase(nama);
        } catch (Exception e) {
            log.error("Error fetching jabatan by nama {}: {}", nama, e.getMessage());
            throw new RuntimeException("Failed to fetch jabatan: " + e.getMessage());
        }
    }
    
    public JabatanResponse createJabatan(JabatanRequest request) {
        try {
            // Check if nama already exists
            if (jabatanRepository.existsByNamaIgnoreCase(request.getNama())) {
                throw new RuntimeException("Jabatan dengan nama '" + request.getNama() + "' sudah ada");
            }
            
            Pegawai manager = null;
            if (request.getManagerId() != null) {
                manager = pegawaiRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager tidak ditemukan dengan ID: " + request.getManagerId()));
            }
            
            Jabatan jabatan = Jabatan.builder()
                .nama(request.getNama())
                .deskripsi(request.getDeskripsi())
                .manager(manager)
                .isActive(request.getIsActive())
                .sortOrder(request.getSortOrder())
                .build();
            
            log.info("Creating new jabatan: {}", jabatan.getNama());
            Jabatan savedJabatan = jabatanRepository.save(jabatan);
            return JabatanResponse.from(savedJabatan);
        } catch (Exception e) {
            log.error("Error creating jabatan: {}", e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to create jabatan: " + e.getMessage());
        }
    }
    
    public JabatanResponse updateJabatan(Long id, JabatanRequest request) {
        try {
            Jabatan existingJabatan = jabatanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jabatan tidak ditemukan dengan ID: " + id));
            
            // Check if nama already exists for other records
            if (jabatanRepository.existsByNamaIgnoreCaseAndIdNot(request.getNama(), id)) {
                throw new RuntimeException("Jabatan dengan nama '" + request.getNama() + "' sudah ada");
            }
            
            Pegawai manager = null;
            if (request.getManagerId() != null) {
                manager = pegawaiRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Manager tidak ditemukan dengan ID: " + request.getManagerId()));
            }
            
            existingJabatan.setNama(request.getNama());
            existingJabatan.setDeskripsi(request.getDeskripsi());
            existingJabatan.setManager(manager);
            existingJabatan.setIsActive(request.getIsActive());
            existingJabatan.setSortOrder(request.getSortOrder());
            
            log.info("Updating jabatan: {}", existingJabatan.getNama());
            Jabatan savedJabatan = jabatanRepository.save(existingJabatan);
            return JabatanResponse.from(savedJabatan);
        } catch (Exception e) {
            log.error("Error updating jabatan with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to update jabatan: " + e.getMessage());
        }
    }
    
    public void deleteJabatan(Long id) {
        try {
            Jabatan jabatan = jabatanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jabatan tidak ditemukan dengan ID: " + id));
            
            log.info("Deleting jabatan: {}", jabatan.getNama());
            jabatanRepository.delete(jabatan);
        } catch (Exception e) {
            log.error("Error deleting jabatan with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to delete jabatan: " + e.getMessage());
        }
    }
    
    public JabatanResponse toggleJabatanStatus(Long id) {
        try {
            Jabatan jabatan = jabatanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jabatan tidak ditemukan dengan ID: " + id));
            
            jabatan.setIsActive(!jabatan.getIsActive());
            
            log.info("Toggling jabatan status: {} to {}", jabatan.getNama(), jabatan.getIsActive());
            Jabatan savedJabatan = jabatanRepository.save(jabatan);
            return JabatanResponse.from(savedJabatan);
        } catch (Exception e) {
            log.error("Error toggling jabatan status with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to toggle jabatan status: " + e.getMessage());
        }
    }
}
