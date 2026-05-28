package com.shadcn.backend.repository;

import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.model.Pegawai;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AbsensiRepository extends JpaRepository<Absensi, Long> {
    
    // Find absensi by pegawai and date
    List<Absensi> findByPegawaiAndTanggalOrderByWaktuDesc(Pegawai pegawai, LocalDate tanggal);
    
    // Find absensi by pegawai and date (simple method for getTodayAbsensi)
    List<Absensi> findByPegawaiAndTanggal(Pegawai pegawai, LocalDate tanggal);
    
    // Find absensi by pegawai within date range
    List<Absensi> findByPegawaiAndTanggalBetweenOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate);
    
    // Find absensi by pegawai for current month
    @Query("SELECT a FROM Absensi a WHERE a.pegawai = :pegawai " +
           "AND YEAR(a.tanggal) = :year AND MONTH(a.tanggal) = :month " +
           "ORDER BY a.tanggal DESC, a.waktu DESC")
    List<Absensi> findByPegawaiAndMonth(@Param("pegawai") Pegawai pegawai, 
                                       @Param("year") int year, 
                                       @Param("month") int month);
    
    // Find absensi by pegawai with pagination
    Page<Absensi> findByPegawaiOrderByTanggalDescWaktuDesc(Pegawai pegawai, Pageable pageable);
    
    // Find absensi by pegawai and date range with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    // Find absensi by pegawai, date range and type with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Pageable pageable);
    
    // Find absensi by pegawai, date range and status with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Absensi.AbsensiStatus status, Pageable pageable);
    
    // Find absensi by pegawai, date range, type and status with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Absensi.AbsensiStatus status, Pageable pageable);
    
    // Find all absensi by pegawai
    List<Absensi> findByPegawaiOrderByTanggalDescWaktuDesc(Pegawai pegawai);
    
    // Find absensi by pegawai within date range (for stats)
    List<Absensi> findByPegawaiAndTanggalBetween(Pegawai pegawai, LocalDate startDate, LocalDate endDate);
    
    // Check if pegawai already has absensi for specific date and type
    Optional<Absensi> findByPegawaiAndTanggalAndType(Pegawai pegawai, LocalDate tanggal, Absensi.AbsensiType type);
    
    // Count statistics
    @Query("SELECT COUNT(a) FROM Absensi a WHERE a.pegawai = :pegawai AND a.status = :status")
    long countByPegawaiAndStatus(@Param("pegawai") Pegawai pegawai, 
                                @Param("status") Absensi.AbsensiStatus status);
    
    @Query("SELECT COUNT(a) FROM Absensi a WHERE a.pegawai = :pegawai " +
           "AND YEAR(a.tanggal) = :year AND MONTH(a.tanggal) = :month")
    long countByPegawaiAndMonth(@Param("pegawai") Pegawai pegawai, 
                               @Param("year") int year, 
                               @Param("month") int month);
    
    // Master data methods for admin - find all absensi (all pegawai)
    List<Absensi> findByTanggalBetween(LocalDate startDate, LocalDate endDate);
    
    Page<Absensi> findByTanggalBetweenOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    Page<Absensi> findByTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Pageable pageable);
    
    Page<Absensi> findByTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Absensi.AbsensiStatus status, Pageable pageable);
    
    Page<Absensi> findByTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Absensi.AbsensiStatus status, Pageable pageable);

    // Dashboard table queries
    @Query(value = """
        SELECT p.id, p.name, j.nama_jabatan, a.waktu, a.status, p.photo_url
        FROM absensi a
        JOIN pegawai p ON a.pegawai_id = p.id
        LEFT JOIN jabatan j ON p.jabatan_id = j.id
        WHERE a.tanggal = :today 
        AND a.type = 'MASUK'
        AND a.status != 'ALPHA'
        ORDER BY a.waktu ASC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> findTop10EarliestArrivalsToday(@Param("today") LocalDate today);

    @Query(value = """
        SELECT p.id, p.name, j.nama_jabatan, 
               COUNT(a.id) as total_hadir,
               AVG(CASE WHEN a.type = 'MASUK' THEN 
                   HOUR(a.waktu) * 60 + MINUTE(a.waktu) 
                   ELSE NULL END) as avg_arrival_minutes,
               CONCAT(
                   ROUND(
                       (COUNT(CASE WHEN a.type = 'MASUK' AND a.status = 'HADIR' THEN 1 END) * 100.0 / 
                        COUNT(CASE WHEN a.type = 'MASUK' THEN 1 END)), 1
                   ), '%'
               ) as ketepatan_rate,
               p.photo_url
        FROM pegawai p
        LEFT JOIN jabatan j ON p.jabatan_id = j.id
        LEFT JOIN absensi a ON p.id = a.pegawai_id 
                             AND a.tanggal BETWEEN :startDate AND :endDate
        WHERE p.is_active = true
        GROUP BY p.id, p.name, j.nama_jabatan, p.photo_url
        HAVING COUNT(CASE WHEN a.type = 'MASUK' THEN 1 END) > 0
        ORDER BY avg_arrival_minutes ASC, ketepatan_rate DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> findTop10ExemplaryEmployeesThisMonth(@Param("startDate") LocalDate startDate, 
                                                        @Param("endDate") LocalDate endDate);

    // Daily statistics queries
    @Query("SELECT COUNT(DISTINCT a.pegawai) FROM Absensi a WHERE a.tanggal = :today AND a.type = :type")
    long countByTanggalAndType(@Param("today") LocalDate today, @Param("type") Absensi.AbsensiType type);

    @Query("SELECT COUNT(DISTINCT a.pegawai) FROM Absensi a WHERE a.tanggal = :today AND a.type = :type AND a.status = :status")
    long countByTanggalAndTypeAndStatus(@Param("today") LocalDate today, 
                                       @Param("type") Absensi.AbsensiType type, 
                                       @Param("status") Absensi.AbsensiStatus status);

    // Delete methods
    long deleteByTanggalBetween(LocalDate startDate, LocalDate endDate);
}
