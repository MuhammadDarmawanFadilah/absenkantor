package com.shadcn.backend.service;

import com.shadcn.backend.dto.ShiftRequest;
import com.shadcn.backend.dto.ShiftResponse;
import com.shadcn.backend.entity.Shift;
import com.shadcn.backend.repository.ShiftRepository;
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
public class ShiftService {
    
    private final ShiftRepository shiftRepository;
    
    public Page<ShiftResponse> getAllShiftPaged(String search, int page, int size, String sortBy, String sortDirection) {
        try {
            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Sort sort = Sort.by(direction, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Shift> shiftPage = shiftRepository.findBySearchTerm(search, pageable);
            return shiftPage.map(ShiftResponse::new);
        } catch (Exception e) {
            log.error("Error fetching shift with pagination: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch shift data: " + e.getMessage());
        }
    }
    
    public List<ShiftResponse> getAllActiveShift() {
        try {
            List<Shift> shifts = shiftRepository.findByIsActiveTrueOrderByNamaShiftAsc();
            return shifts.stream().map(ShiftResponse::new).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching active shift: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch active shift: " + e.getMessage());
        }
    }
    
    public List<ShiftResponse> getAllShift() {
        try {
            List<Shift> shifts = shiftRepository.findAllByOrderByNamaShiftAsc();
            return shifts.stream().map(ShiftResponse::new).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching all shift: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch shift data: " + e.getMessage());
        }
    }
    
    public Optional<ShiftResponse> getShiftById(Long id) {
        try {
            return shiftRepository.findById(id).map(ShiftResponse::new);
        } catch (Exception e) {
            log.error("Error fetching shift by id {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to fetch shift: " + e.getMessage());
        }
    }
    
    public Optional<ShiftResponse> getShiftByNama(String namaShift) {
        try {
            return shiftRepository.findByNamaShiftIgnoreCase(namaShift).map(ShiftResponse::new);
        } catch (Exception e) {
            log.error("Error fetching shift by nama {}: {}", namaShift, e.getMessage());
            throw new RuntimeException("Failed to fetch shift: " + e.getMessage());
        }
    }
    
    public ShiftResponse createShift(ShiftRequest request) {
        try {
            // Check if nama already exists
            if (shiftRepository.existsByNamaShiftIgnoreCase(request.getNamaShift())) {
                throw new RuntimeException("Shift dengan nama '" + request.getNamaShift() + "' sudah ada");
            }
            
            log.info("Creating new shift: {}", request.getNamaShift());
            
            Shift shift = Shift.builder()
                    .namaShift(request.getNamaShift())
                    .jamMasuk(request.getJamMasuk())
                    .jamKeluar(request.getJamKeluar())
                    .deskripsi(request.getDeskripsi())
                    .lockLokasi(request.getLockLokasi())
                    .isActive(request.getIsActive())
                    .build();
            
            Shift savedShift = shiftRepository.save(shift);
            return new ShiftResponse(savedShift);
        } catch (Exception e) {
            log.error("Error creating shift: {}", e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to create shift: " + e.getMessage());
        }
    }
    
    public ShiftResponse updateShift(Long id, ShiftRequest request) {
        try {
            Shift existingShift = shiftRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shift tidak ditemukan dengan id: " + id));
            
            // Check if nama already exists (excluding current record)
            Optional<Shift> existingByNama = shiftRepository.findByNamaShiftIgnoreCase(request.getNamaShift());
            if (existingByNama.isPresent() && !existingByNama.get().getId().equals(id)) {
                throw new RuntimeException("Shift dengan nama '" + request.getNamaShift() + "' sudah ada");
            }
            
            existingShift.setNamaShift(request.getNamaShift());
            existingShift.setJamMasuk(request.getJamMasuk());
            existingShift.setJamKeluar(request.getJamKeluar());
            existingShift.setDeskripsi(request.getDeskripsi());
            existingShift.setLockLokasi(request.getLockLokasi());
            existingShift.setIsActive(request.getIsActive());
            
            log.info("Updating shift: {}", existingShift.getNamaShift());
            Shift savedShift = shiftRepository.save(existingShift);
            return new ShiftResponse(savedShift);
        } catch (Exception e) {
            log.error("Error updating shift with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to update shift: " + e.getMessage());
        }
    }
    
    public void deleteShift(Long id) {
        try {
            Shift shift = shiftRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shift tidak ditemukan dengan id: " + id));
            
            // TODO: Add check for related entities (employees using this shift)
            // For now, we'll allow deletion
            
            log.info("Deleting shift: {}", shift.getNamaShift());
            shiftRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Error deleting shift with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to delete shift: " + e.getMessage());
        }
    }
    
    public ShiftResponse toggleShiftStatus(Long id) {
        try {
            Shift shift = shiftRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Shift tidak ditemukan dengan id: " + id));
            
            shift.setIsActive(!shift.getIsActive());
            log.info("Toggling shift status: {} to {}", shift.getNamaShift(), shift.getIsActive());
            
            Shift savedShift = shiftRepository.save(shift);
            return new ShiftResponse(savedShift);
        } catch (Exception e) {
            log.error("Error toggling shift status with id {}: {}", id, e.getMessage());
            if (e instanceof RuntimeException) {
                throw e;
            }
            throw new RuntimeException("Failed to toggle shift status: " + e.getMessage());
        }
    }
}
