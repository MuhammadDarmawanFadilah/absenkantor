package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "jenis_cuti")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JenisCuti {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nama_cuti", nullable = false, unique = true)
    private String namaCuti;
    
    @Column(name = "deskripsi")
    private String deskripsi;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "jenisCuti", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<PegawaiCuti> pegawaiCutis;
    
    @OneToMany(mappedBy = "jenisCuti", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Cuti> cutis;
}
