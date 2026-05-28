package com.shadcn.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "wilayah_kodepos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WilayahKodepos {
    
    @Id
    @Column(name = "kode", length = 13)
    private String kode;
    
    @Column(name = "kodepos", length = 5)
    private String kodepos;
}
