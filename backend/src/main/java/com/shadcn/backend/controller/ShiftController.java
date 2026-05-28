package com.shadcn.backend.controller;

import com.shadcn.backend.dto.ShiftRequest;
import com.shadcn.backend.dto.ShiftResponse;
import com.shadcn.backend.service.ShiftService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin/master-data/shift")
@RequiredArgsConstructor
@Slf4j
public class ShiftController {
    
    private final ShiftService shiftService;
    
    @GetMapping
    // @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<Page<ShiftResponse>> getAllShift(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "sortOrder") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            Page<ShiftResponse> shiftPage = shiftService.getAllShiftPaged(search, page, size, sortBy, sortDir);
            return ResponseEntity.ok(shiftPage);
        } catch (Exception e) {
            log.error("Error fetching shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR') or hasRole('USER')")
    public ResponseEntity<List<ShiftResponse>> getActiveShift() {
        try {
            List<ShiftResponse> activeShift = shiftService.getAllActiveShift();
            return ResponseEntity.ok(activeShift);
        } catch (Exception e) {
            log.error("Error fetching active shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<List<ShiftResponse>> getAllShiftList() {
        try {
            List<ShiftResponse> shiftList = shiftService.getAllShift();
            return ResponseEntity.ok(shiftList);
        } catch (Exception e) {
            log.error("Error fetching all shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<ShiftResponse> getShiftById(@PathVariable Long id) {
        try {
            return shiftService.getShiftById(id)
                .map(shift -> ResponseEntity.ok(shift))
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching shift by id {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    // @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> createShift(@Valid @RequestBody ShiftRequest request) {
        try {
            ShiftResponse createdShift = shiftService.createShift(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdShift);
        } catch (RuntimeException e) {
            log.error("Error creating shift: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error creating shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> updateShift(@PathVariable Long id, @Valid @RequestBody ShiftRequest request) {
        try {
            ShiftResponse updatedShift = shiftService.updateShift(id, request);
            return ResponseEntity.ok(updatedShift);
        } catch (RuntimeException e) {
            log.error("Error updating shift: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> deleteShift(@PathVariable Long id) {
        try {
            shiftService.deleteShift(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting shift: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error deleting shift: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('VERIFICATOR')")
    public ResponseEntity<?> toggleShiftStatus(@PathVariable Long id) {
        try {
            ShiftResponse updatedShift = shiftService.toggleShiftStatus(id);
            return ResponseEntity.ok(updatedShift);
        } catch (RuntimeException e) {
            log.error("Error toggling shift status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error toggling shift status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Internal server error"));
        }
    }
    
    // Error response class
    public static class ErrorResponse {
        private String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}
