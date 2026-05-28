package com.shadcn.backend.service;

import com.shadcn.backend.dto.LokasiRequest;
import com.shadcn.backend.dto.LokasiResponse;
import com.shadcn.backend.model.Lokasi;
import com.shadcn.backend.repository.LokasiRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LokasiService {
    
    private final LokasiRepository lokasiRepository;
    
    public Page<LokasiResponse> getAllLokasiPaged(String search, int page, int size, String sortBy, String sortDirection) {
        try {
            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Sort sort = Sort.by(direction, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Lokasi> lokasiPage = lokasiRepository.findBySearchTerm(search, pageable);
            return lokasiPage.map(LokasiResponse::new);
        } catch (Exception e) {
            log.error("Error fetching lokasi with pagination: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch lokasi data: " + e.getMessage());
        }
    }
    
    public List<LokasiResponse> getAllActiveLokasi() {
        try {
            List<Lokasi> lokasis = lokasiRepository.findByIsActiveTrueOrderByNamaLokasiAsc();
            return lokasis.stream().map(LokasiResponse::new).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching active lokasi: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch active lokasi: " + e.getMessage());
        }
    }
    
    public List<LokasiResponse> getAllLokasi() {
        try {
            List<Lokasi> lokasis = lokasiRepository.findAllByOrderByNamaLokasiAsc();
            return lokasis.stream().map(LokasiResponse::new).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all lokasi: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch lokasi data: " + e.getMessage());
        }
    }
    
    public Optional<LokasiResponse> getLokasiById(Long id) {
        try {
            return lokasiRepository.findById(id).map(LokasiResponse::new);
        } catch (Exception e) {
            log.error("Error fetching lokasi by id {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to fetch lokasi: " + e.getMessage());
        }
    }
    
    public Optional<LokasiResponse> getLokasiByNama(String namaLokasi) {
        try {
            return lokasiRepository.findByNamaLokasiIgnoreCase(namaLokasi).map(LokasiResponse::new);
        } catch (Exception e) {
            log.error("Error fetching lokasi by nama {}: {}", namaLokasi, e.getMessage());
            throw new RuntimeException("Failed to fetch lokasi: " + e.getMessage());
        }
    }
    
    public LokasiResponse createLokasi(LokasiRequest request) {
        try {
            // Check if nama already exists
            if (lokasiRepository.existsByNamaLokasiIgnoreCase(request.getNamaLokasi())) {
                throw new RuntimeException("Lokasi dengan nama '" + request.getNamaLokasi() + "' sudah ada");
            }
            
            log.info("Creating new lokasi: {}", request.getNamaLokasi());
            
            Lokasi lokasi = Lokasi.builder()
                    .namaLokasi(request.getNamaLokasi())
                    .alamat(request.getAlamat() != null ? request.getAlamat() : "")
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .radius(request.getRadius())
                    .status(request.getStatus() != null ? request.getStatus() : "aktif")
                    .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                    .build();
            
            Lokasi savedLokasi = lokasiRepository.save(lokasi);
            return new LokasiResponse(savedLokasi);
        } catch (Exception e) {
            log.error("Error creating lokasi: {}", e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to create lokasi: " + e.getMessage());
        }
    }
    
    public LokasiResponse updateLokasi(Long id, LokasiRequest request) {
        try {
            Lokasi existingLokasi = lokasiRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lokasi tidak ditemukan dengan id: " + id));
            
            // Check if nama already exists (excluding current record)
            Optional<Lokasi> existingByNama = lokasiRepository.findByNamaLokasiIgnoreCase(request.getNamaLokasi());
            if (existingByNama.isPresent() && !existingByNama.get().getId().equals(id)) {
                throw new RuntimeException("Lokasi dengan nama '" + request.getNamaLokasi() + "' sudah ada");
            }
            
            existingLokasi.setNamaLokasi(request.getNamaLokasi());
            existingLokasi.setAlamat(request.getAlamat() != null ? request.getAlamat() : existingLokasi.getAlamat());
            existingLokasi.setLatitude(request.getLatitude());
            existingLokasi.setLongitude(request.getLongitude());
            existingLokasi.setRadius(request.getRadius());
            existingLokasi.setStatus(request.getStatus() != null ? request.getStatus() : existingLokasi.getStatus());
            existingLokasi.setIsActive(request.getIsActive() != null ? request.getIsActive() : existingLokasi.getIsActive());
            
            log.info("Updating lokasi: {}", existingLokasi.getNamaLokasi());
            Lokasi savedLokasi = lokasiRepository.save(existingLokasi);
            return new LokasiResponse(savedLokasi);
        } catch (Exception e) {
            log.error("Error updating lokasi with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to update lokasi: " + e.getMessage());
        }
    }
    
    public void deleteLokasi(Long id) {
        try {
            Lokasi lokasi = lokasiRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lokasi tidak ditemukan dengan id: " + id));
            
            // TODO: Add check for related entities (employees using this location)
            // For now, we'll allow deletion
            
            log.info("Deleting lokasi: {}", lokasi.getNamaLokasi());
            lokasiRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Error deleting lokasi with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to delete lokasi: " + e.getMessage());
        }
    }
    
    public LokasiResponse toggleLokasiStatus(Long id) {
        try {
            Lokasi lokasi = lokasiRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lokasi tidak ditemukan dengan id: " + id));
            
            lokasi.setIsActive(!lokasi.getIsActive());
            log.info("Toggling lokasi status: {} to {}", lokasi.getNamaLokasi(), lokasi.getIsActive());
            
            Lokasi savedLokasi = lokasiRepository.save(lokasi);
            return new LokasiResponse(savedLokasi);
        } catch (Exception e) {
            log.error("Error toggling lokasi status with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to toggle lokasi status: " + e.getMessage());
        }
    }
}
