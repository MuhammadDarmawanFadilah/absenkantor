package com.shadcn.backend.repository;

import com.shadcn.backend.model.Pegawai;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PegawaiRepository extends JpaRepository<Pegawai, Long> {
    
    Optional<Pegawai> findByUsername(String username);
    
    Optional<Pegawai> findByEmail(String email);
    
    Optional<Pegawai> findByNip(String nip);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    // Duplicate check methods for phone number
    boolean existsByNoTelp(String noTelp);
    
    // Duplicate check methods for NIP
    boolean existsByNip(String nip);
    
    // Duplicate check methods excluding specific ID (for edit operations)
    boolean existsByUsernameAndIdNot(String username, Long id);
    
    boolean existsByEmailAndIdNot(String email, Long id);
    
    boolean existsByNoTelpAndIdNot(String noTelp, Long id);
    
    boolean existsByNipAndIdNot(String nip, Long id);
    
    List<Pegawai> findByIsActive(Boolean isActive);

    Page<Pegawai> findByIsActive(Boolean isActive, Pageable pageable);
    
    List<Pegawai> findByJabatan_Nama(String jabatanNama);
    
    Long countByIsActive(Boolean isActive);
    
    // Search methods
    List<Pegawai> findByNamaLengkapContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String namaLengkap, String username, String email);
    
    Page<Pegawai> findByNamaLengkapContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String namaLengkap, String username, String email, Pageable pageable);
    
    // Query methods for wilayah
    List<Pegawai> findByProvinsi(String provinsi);
    
    List<Pegawai> findByProvinsiAndKota(String provinsi, String kota);
    
    List<Pegawai> findByProvinsiAndKotaAndKecamatan(String provinsi, String kota, String kecamatan);
    
    List<Pegawai> findByProvinsiAndKotaAndKecamatanAndKelurahan(
            String provinsi, String kota, String kecamatan, String kelurahan);
    

    
    // Advanced filtering query
    @Query("SELECT p FROM Pegawai p WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(p.namaLengkap) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(p.noTelp) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " (p.jabatan IS NOT NULL AND LOWER(p.jabatan.nama) LIKE LOWER(CONCAT('%', :search, '%')))) AND " +
           "(:nama IS NULL OR :nama = '' OR LOWER(p.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%'))) AND " +
           "(:nip IS NULL OR :nip = '' OR LOWER(p.nip) LIKE LOWER(CONCAT('%', :nip, '%'))) AND " +
           "(:email IS NULL OR :email = '' OR LOWER(p.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:noTelp IS NULL OR :noTelp = '' OR LOWER(p.noTelp) LIKE LOWER(CONCAT('%', :noTelp, '%'))) AND " +
           "(:isActive IS NULL OR p.isActive = :isActive) AND " +
           "(:jabatan IS NULL OR :jabatan = '' OR (p.jabatan IS NOT NULL AND LOWER(p.jabatan.nama) LIKE LOWER(CONCAT('%', :jabatan, '%')))) AND " +
           "(:role IS NULL OR :role = '' OR LOWER(p.isAdmin) LIKE LOWER(CONCAT('%', :role, '%')))")
    Page<Pegawai> findPegawaiWithFilters(@Param("search") String search,
                                        @Param("nama") String nama,
                                        @Param("nip") String nip,
                                        @Param("email") String email,
                                        @Param("noTelp") String noTelp,
                                        @Param("isActive") Boolean isActive, 
                                        @Param("jabatan") String jabatan,
                                        @Param("role") String role,
                                        Pageable pageable);
    
    // Monthly statistics for dashboard
    @Query("SELECT COUNT(p) FROM Pegawai p WHERE YEAR(p.createdAt) = :year AND MONTH(p.createdAt) = :month")
    Long countByCreatedAtYearAndMonth(@Param("year") int year, @Param("month") int month);
}
