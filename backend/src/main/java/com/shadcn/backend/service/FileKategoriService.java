package com.shadcn.backend.service;

import com.shadcn.backend.dto.FileKategoriRequest;
import com.shadcn.backend.dto.FileKategoriResponse;
import com.shadcn.backend.exception.DuplicateResourceException;
import com.shadcn.backend.exception.ResourceNotFoundException;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.FileKategori;
import com.shadcn.backend.repository.FileKategoriRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileKategoriService {
    
    private final FileKategoriRepository repository;
    
    @Transactional(readOnly = true)
    public Page<FileKategoriResponse> findAll(String search, Boolean isActive, int page, int size, String sortBy, String sortDir) {
        log.info("Finding all file kategori with search: {}, isActive: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                search, isActive, page, size, sortBy, sortDir);
        
        // Create sort direction
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FileKategori> entities;
        
        // Use different repository methods based on filter criteria
        if (search != null && !search.trim().isEmpty() && isActive != null) {
            entities = repository.findByNamaContainingIgnoreCaseAndIsActiveOrderBySortOrderAscNamaAsc(search.trim(), isActive, pageable);
        } else if (search != null && !search.trim().isEmpty()) {
            entities = repository.findByNamaContainingIgnoreCaseOrderBySortOrderAscNamaAsc(search.trim(), pageable);
        } else if (isActive != null) {
            entities = repository.findByIsActiveOrderBySortOrderAscNamaAsc(isActive, pageable);
        } else {
            entities = repository.findAllByOrderBySortOrderAscNamaAsc(pageable);
        }
        
        return entities.map(this::toResponse);
    }

    // Overloaded method for backward compatibility
    @Transactional(readOnly = true)
    public Page<FileKategoriResponse> findAll(String search, Boolean isActive, int page, int size) {
        return findAll(search, isActive, page, size, "sortOrder", "asc");
    }
    
    @Transactional(readOnly = true)
    public List<FileKategoriResponse> findAllActive() {
        log.info("Finding all active file kategori");
        List<FileKategori> entities = repository.findByIsActiveTrueOrderBySortOrderAscNamaAsc();
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public FileKategoriResponse findById(Long id) {
        log.info("Finding file kategori by id: {}", id);
        FileKategori entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data kategori file dengan ID " + id + " tidak ditemukan"));
        return toResponse(entity);
    }
    
    @Transactional
    public FileKategoriResponse create(FileKategoriRequest request) {
        log.info("Creating file kategori: {}", request);
        
        // Validate input
        if (request.getNama() == null || request.getNama().trim().isEmpty()) {
            throw new ValidationException("Nama kategori tidak boleh kosong");
        }
        
        // Check if name already exists
        if (repository.findByNamaIgnoreCase(request.getNama().trim()).isPresent()) {
            throw new DuplicateResourceException("Kategori file dengan nama '" + request.getNama().trim() + "' sudah terdaftar dalam sistem");
        }
        
        FileKategori entity = toEntity(request);
        FileKategori saved = repository.save(entity);
        
        log.info("Created file kategori with id: {}", saved.getId());
        return toResponse(saved);
    }
    
    @Transactional
    public FileKategoriResponse update(Long id, FileKategoriRequest request) {
        log.info("Updating file kategori id: {} with data: {}", id, request);
        
        FileKategori entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data kategori file dengan ID " + id + " tidak ditemukan"));
        
        // Validate input
        if (request.getNama() == null || request.getNama().trim().isEmpty()) {
            throw new ValidationException("Nama kategori tidak boleh kosong");
        }
        
        // Check if name already exists (excluding current entity)
        if (repository.existsByNamaIgnoreCaseAndIdNot(request.getNama().trim(), id)) {
            throw new DuplicateResourceException("Kategori file dengan nama '" + request.getNama().trim() + "' sudah terdaftar dalam sistem");
        }
        
        // Update fields
        entity.setNama(request.getNama().trim());
        entity.setDeskripsi(request.getDeskripsi() != null ? request.getDeskripsi().trim() : null);
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        
        FileKategori updated = repository.save(entity);
        
        log.info("Updated file kategori with id: {}", updated.getId());
        return toResponse(updated);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting file kategori id: {}", id);
        
        FileKategori entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data kategori file dengan ID " + id + " tidak ditemukan"));
        
        repository.delete(entity);
        log.info("Deleted file kategori with id: {}", id);
    }
    
    @Transactional
    public FileKategoriResponse toggleActive(Long id) {
        log.info("Toggling active status for file kategori id: {}", id);
        
        FileKategori entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data kategori file dengan ID " + id + " tidak ditemukan"));
        
        entity.setIsActive(!entity.getIsActive());
        FileKategori updated = repository.save(entity);
        
        log.info("Toggled active status for file kategori id: {} to: {}", id, updated.getIsActive());
        return toResponse(updated);
    }
    
    // Helper methods
    private FileKategoriResponse toResponse(FileKategori entity) {
        return new FileKategoriResponse(
                entity.getId(),
                entity.getNama(),
                entity.getDeskripsi(),
                entity.getIsActive(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    private FileKategori toEntity(FileKategoriRequest request) {
        FileKategori entity = new FileKategori();
        entity.setNama(request.getNama().trim());
        entity.setDeskripsi(request.getDeskripsi() != null ? request.getDeskripsi().trim() : null);
        entity.setIsActive(request.getIsActive());
        entity.setSortOrder(request.getSortOrder());
        return entity;
    }
}
