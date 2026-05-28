package com.shadcn.backend.service;

import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.Jabatan;
import com.shadcn.backend.model.Lokasi;
import com.shadcn.backend.dto.PegawaiRequest;
import com.shadcn.backend.dto.UpdatePegawaiRequest;
import com.shadcn.backend.dto.SelfUpdatePegawaiRequest;
import com.shadcn.backend.dto.PegawaiResponse;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.repository.JabatanRepository;
import com.shadcn.backend.repository.LokasiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PegawaiService {

    private final PegawaiRepository pegawaiRepository;
    private final JabatanRepository jabatanRepository;
    private final LokasiRepository lokasiRepository;
    private final PasswordEncoder passwordEncoder;
    private final WilayahCacheService wilayahCacheService;

    public List<PegawaiResponse> getAllPegawai() {
        log.info("Fetching all pegawai");
        return pegawaiRepository.findAll().stream()
                .map(this::createPegawaiResponseWithLocationNames)
                .collect(Collectors.toList());
    }

    public Page<PegawaiResponse> getPegawaiWithPaging(int page, int size, String sortBy, String sortDir) {
        log.info("Fetching pegawai with paging - page: {}, size: {}", page, size);
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Pegawai> pegawaiPage = pegawaiRepository.findAll(pageable);
        return pegawaiPage.map(this::createPegawaiResponseWithLocationNames);
    }

    public Optional<PegawaiResponse> getPegawaiById(Long id) {
        log.info("Fetching pegawai by id: {}", id);
        return pegawaiRepository.findById(id)
                .map(this::createPegawaiResponseWithLocationNames);
    }

    public Optional<PegawaiResponse> getPegawaiByUsername(String username) {
        log.info("Fetching pegawai by username: {}", username);
        return pegawaiRepository.findByUsername(username)
                .map(this::createPegawaiResponseWithLocationNames);
    }

    public List<PegawaiResponse> searchPegawai(String keyword) {
        log.info("Searching pegawai with keyword: {}", keyword);
        List<Pegawai> pegawaiList = pegawaiRepository.findByNamaLengkapContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                keyword, keyword, keyword);
        return pegawaiList.stream()
                .map(this::createPegawaiResponseWithLocationNames)
                .collect(Collectors.toList());
    }

    public Page<PegawaiResponse> searchPegawaiWithPaging(String keyword, int page, int size) {
        log.info("Searching pegawai with paging - keyword: {}, page: {}, size: {}", keyword, page, size);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<Pegawai> pegawaiPage = pegawaiRepository.findByNamaLengkapContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                keyword, keyword, keyword, pageable);
        
        return pegawaiPage.map(this::createPegawaiResponseWithLocationNames);
    }

    public Page<PegawaiResponse> getPegawaiWithFilters(String search, String nama, String nip, String email, String phoneNumber, 
                                                       String status, String jabatan, String role, int page, int size, String sortBy, String sortDir) {
        log.info("Fetching pegawai with filters - search: {}, nama: {}, nip: {}, email: {}, phoneNumber: {}, status: {}, jabatan: {}, role: {}, page: {}, size: {}", 
                search, nama, nip, email, phoneNumber, status, jabatan, role, page, size);
        
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // If no filters are applied, return all pegawai
        if ((search == null || search.trim().isEmpty()) && 
            (nama == null || nama.trim().isEmpty()) &&
            (nip == null || nip.trim().isEmpty()) &&
            (email == null || email.trim().isEmpty()) &&
            (phoneNumber == null || phoneNumber.trim().isEmpty()) &&
            (status == null || status.trim().isEmpty()) && 
            (jabatan == null || jabatan.trim().isEmpty()) &&
            (role == null || role.trim().isEmpty())) {
            Page<Pegawai> pegawaiPage = pegawaiRepository.findAll(pageable);
            return pegawaiPage.map(this::createPegawaiResponseWithLocationNames);
        }
        
        // Convert status string to Boolean
        Boolean isActive = null;
        if (status != null && !status.trim().isEmpty()) {
            isActive = "true".equalsIgnoreCase(status.trim()) || "active".equalsIgnoreCase(status.trim());
        }
        
        // Apply filters using custom repository method
        Page<Pegawai> pegawaiPage = pegawaiRepository.findPegawaiWithFilters(search, nama, nip, email, phoneNumber, isActive, jabatan, role, pageable);
        return pegawaiPage.map(this::createPegawaiResponseWithLocationNames);
    }

    public PegawaiResponse createPegawai(PegawaiRequest request) {
        log.info("Creating new pegawai: {}", request.getUsername());
        
        // Check if username already exists
        if (pegawaiRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }
        
        // Check if email already exists
        if (request.getEmail() != null && pegawaiRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        // Find jabatan if provided
        Jabatan jabatanEntity = null;
        if (request.getJabatanId() != null) {
            jabatanEntity = jabatanRepository.findById(request.getJabatanId())
                .orElseThrow(() -> new RuntimeException("Jabatan not found with ID: " + request.getJabatanId()));
        }

        // Find lokasi if provided
        Lokasi lokasiEntity = null;
        if (request.getLokasiId() != null) {
            lokasiEntity = lokasiRepository.findById(request.getLokasiId())
                .orElseThrow(() -> new RuntimeException("Lokasi not found with ID: " + request.getLokasiId()));
        }

        Pegawai pegawai = Pegawai.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .namaLengkap(request.getNamaLengkap())
                .fotoKaryawan(request.getFotoKaryawan())
                .photoUrl(request.getFotoKaryawan()) // Sync both photo fields
                .fotoFaceRecognition(request.getFotoFaceRecognition())
                .email(request.getEmail())
                .noTelp(request.getNoTelp())
                .tanggalLahir(request.getTanggalLahir())
                .jenisKelamin(request.getJenisKelamin())
                .tanggalMasuk(request.getTanggalMasuk())
                .statusNikah(request.getStatusNikah())
                .alamat(request.getAlamat())
                .izinCuti(request.getIzinCuti())
                .izinLainnya(request.getIzinLainnya())
                .izinTelat(request.getIzinTelat())
                .izinPulangCepat(request.getIzinPulangCepat())
                .isAdmin(request.getIsAdmin())
                .rekening(request.getRekening())
                .gajiPokok(request.getGajiPokok())
                .makanTransport(request.getMakanTransport())
                .lembur(request.getLembur())
                .kehadiran(request.getKehadiran())
                .thr(request.getThr())
                .bonus(request.getBonus())
                .izin(request.getIzin())
                .terlambat(request.getTerlambat())
                .mangkir(request.getMangkir())
                .saldoKasbon(request.getSaldoKasbon())
                .potonganBpjs(request.getPotonganBpjs())
                .potonganPajak(request.getPotonganPajak())
                .tunjanganKinerja(request.getTunjanganKinerja())
                .tunjanganTransportasi(request.getTunjanganTransportasi())
                .nip(request.getNip())
                .pendidikan(request.getPendidikan())
                .tempatLahir(request.getTempatLahir())
                .role(request.getRole())
                .jabatan(jabatanEntity)
                .lokasi(lokasiEntity)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .provinsi(request.getProvinsi())
                .kota(request.getKota())
                .kecamatan(request.getKecamatan())
                .kelurahan(request.getKelurahan())
                .kodePos(request.getKodePos())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .photoUrl(request.getPhotoUrl())
                .fotoKaryawan(request.getPhotoUrl()) // Sync both photo fields
                .build();

        // Pemilihan functionality has been removed - no longer setting pemilihan or totalTps
        pegawai.setTotalTps(0); // Default to 0 since pemilihan functionality is removed

        Pegawai savedPegawai = pegawaiRepository.save(pegawai);
        log.info("Pegawai created successfully with id: {}", savedPegawai.getId());
        
        return createPegawaiResponseWithLocationNames(savedPegawai);
    }

    public PegawaiResponse updatePegawai(Long id, UpdatePegawaiRequest request) {
        log.info("Updating pegawai with id: {}", id);
        
        Pegawai pegawai = pegawaiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pegawai not found with id: " + id));

        // Check if username is being changed and already exists
        if (request.getUsername() != null && !request.getUsername().equals(pegawai.getUsername())) {
            if (pegawaiRepository.existsByUsername(request.getUsername())) {
                throw new RuntimeException("Username already exists: " + request.getUsername());
            }
            pegawai.setUsername(request.getUsername());
        }

        // Check if email is being changed and already exists
        if (request.getEmail() != null && !request.getEmail().equals(pegawai.getEmail())) {
            if (pegawaiRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists: " + request.getEmail());
            }
            pegawai.setEmail(request.getEmail());
        }

        // Update other fields
        if (request.getNamaLengkap() != null) {
            pegawai.setNamaLengkap(request.getNamaLengkap());
        }
        if (request.getNoTelp() != null) {
            pegawai.setNoTelp(request.getNoTelp());
        }
        if (request.getNip() != null) {
            pegawai.setNip(request.getNip());
        }
        if (request.getPendidikan() != null) {
            pegawai.setPendidikan(request.getPendidikan());
        }
        if (request.getRole() != null) {
            pegawai.setRole(request.getRole());
        }
        if (request.getJabatan() != null) {
            Jabatan jabatanEntity = jabatanRepository.findByNamaIgnoreCase(request.getJabatan())
                .orElseThrow(() -> new RuntimeException("Jabatan not found: " + request.getJabatan()));
            pegawai.setJabatan(jabatanEntity);
        }
        if (request.getIsActive() != null) {
            pegawai.setIsActive(request.getIsActive());
        }
        if (request.getAlamat() != null) {
            pegawai.setAlamat(request.getAlamat());
        }
        if (request.getProvinsi() != null) {
            pegawai.setProvinsi(request.getProvinsi());
        }
        if (request.getKota() != null) {
            pegawai.setKota(request.getKota());
        }
        if (request.getKecamatan() != null) {
            pegawai.setKecamatan(request.getKecamatan());
        }
        if (request.getKelurahan() != null) {
            pegawai.setKelurahan(request.getKelurahan());
        }
        if (request.getKodePos() != null) {
            pegawai.setKodePos(request.getKodePos());
        }
        if (request.getLatitude() != null) {
            pegawai.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            pegawai.setLongitude(request.getLongitude());
        }
        if (request.getPhotoUrl() != null) {
            pegawai.setPhotoUrl(request.getPhotoUrl());
            // Also update fotoKaryawan for backward compatibility
            pegawai.setFotoKaryawan(request.getPhotoUrl());
        }

        // Update salary and benefit fields
        if (request.getGajiPokok() != null) {
            pegawai.setGajiPokok(request.getGajiPokok());
        }
        if (request.getMakanTransport() != null) {
            pegawai.setMakanTransport(request.getMakanTransport());
        }
        if (request.getLembur() != null) {
            pegawai.setLembur(request.getLembur());
        }
        if (request.getKehadiran() != null) {
            pegawai.setKehadiran(request.getKehadiran());
        }
        if (request.getThr() != null) {
            pegawai.setThr(request.getThr());
        }
        if (request.getBonus() != null) {
            pegawai.setBonus(request.getBonus());
        }
        if (request.getTunjanganKeluarga() != null) {
            pegawai.setTunjanganKeluarga(request.getTunjanganKeluarga());
        }
        if (request.getTunjanganKinerja() != null) {
            pegawai.setTunjanganKinerja(request.getTunjanganKinerja());
        }
        if (request.getTunjanganTransportasi() != null) {
            pegawai.setTunjanganTransportasi(request.getTunjanganTransportasi());
        }
        if (request.getIzin() != null) {
            pegawai.setIzin(request.getIzin());
        }
        if (request.getTerlambat() != null) {
            pegawai.setTerlambat(request.getTerlambat());
        }
        if (request.getMangkir() != null) {
            pegawai.setMangkir(request.getMangkir());
        }
        if (request.getSaldoKasbon() != null) {
            pegawai.setSaldoKasbon(request.getSaldoKasbon());
        }
        if (request.getPotonganBpjs() != null) {
            pegawai.setPotonganBpjs(request.getPotonganBpjs());
        }
        if (request.getPotonganPajak() != null) {
            pegawai.setPotonganPajak(request.getPotonganPajak());
        }

        // Update cuti fields
        if (request.getIzinCuti() != null) {
            pegawai.setIzinCuti(request.getIzinCuti());
        }
        if (request.getIzinLainnya() != null) {
            pegawai.setIzinLainnya(request.getIzinLainnya());
        }
        if (request.getIzinTelat() != null) {
            pegawai.setIzinTelat(request.getIzinTelat());
        }
        if (request.getIzinPulangCepat() != null) {
            pegawai.setIzinPulangCepat(request.getIzinPulangCepat());
        }

        // Update personal fields
        if (request.getTanggalLahir() != null) {
            pegawai.setTanggalLahir(request.getTanggalLahir());
        }
        if (request.getJenisKelamin() != null) {
            pegawai.setJenisKelamin(request.getJenisKelamin());
        }
        if (request.getStatusNikah() != null) {
            pegawai.setStatusNikah(request.getStatusNikah());
        }
        if (request.getTempatLahir() != null) {
            pegawai.setTempatLahir(request.getTempatLahir());
        }
        if (request.getTanggalMasuk() != null) {
            pegawai.setTanggalMasuk(request.getTanggalMasuk());
        }
        if (request.getRekening() != null) {
            pegawai.setRekening(request.getRekening());
        }
        if (request.getFotoKaryawan() != null) {
            pegawai.setFotoKaryawan(request.getFotoKaryawan());
        }
        if (request.getFotoFaceRecognition() != null) {
            pegawai.setFotoFaceRecognition(request.getFotoFaceRecognition());
        }
        if (request.getIsAdmin() != null) {
            pegawai.setIsAdmin(request.getIsAdmin() ? "1" : "0");
        }
        
        // Update lokasi if provided
        if (request.getLokasiId() != null) {
            Lokasi lokasiEntity = lokasiRepository.findById(request.getLokasiId())
                .orElseThrow(() -> new RuntimeException("Lokasi not found with ID: " + request.getLokasiId()));
            pegawai.setLokasi(lokasiEntity);
        }

        // Update password if provided
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            pegawai.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Pemilihan functionality has been removed - no longer updating pemilihan

        pegawai.setUpdatedAt(LocalDateTime.now());
        Pegawai updatedPegawai = pegawaiRepository.save(pegawai);
        
        log.info("Pegawai updated successfully with id: {}", updatedPegawai.getId());
        return createPegawaiResponseWithLocationNames(updatedPegawai);
    }

    public void deletePegawai(Long id) {
        log.info("Deleting pegawai with id: {}", id);
        
        Pegawai pegawai = pegawaiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pegawai not found with id: " + id));
        
        pegawaiRepository.delete(pegawai);
        log.info("Pegawai deleted successfully with id: {}", id);
    }

    public List<PegawaiResponse> getPegawaiByStatus(Boolean isActive) {
        log.info("Fetching pegawai by status: {}", isActive);
        return pegawaiRepository.findByIsActive(isActive).stream()
                .map(this::createPegawaiResponseWithLocationNames)
                .collect(Collectors.toList());
    }

    public List<PegawaiResponse> getPegawaiByJabatan(String jabatan) {
        log.info("Fetching pegawai by jabatan: {}", jabatan);
        return pegawaiRepository.findByJabatan_Nama(jabatan).stream()
                .map(this::createPegawaiResponseWithLocationNames)
                .collect(Collectors.toList());
    }

    public PegawaiResponse assignPemilihanToPegawai(Long pegawaiId, Long pemilihanId) {
        log.info("REMOVED: assignPemilihanToPegawai method - functionality disabled");
        throw new UnsupportedOperationException("Pemilihan functionality has been removed");
    }

    public PegawaiResponse removePemilihanFromPegawai(Long pegawaiId, Long pemilihanId) {
        log.info("REMOVED: removePemilihanFromPegawai method - functionality disabled");
        throw new UnsupportedOperationException("Pemilihan functionality has been removed");
    }

    public Long getTotalPegawai() {
        return pegawaiRepository.count();
    }

    public Long getTotalActivePegawai() {
        return pegawaiRepository.countByIsActive(true);
    }

    @Transactional
    public void recalculateAllTotalTps() {
        log.info("REMOVED: recalculateAllTotalTps method - functionality disabled");
        // Pemilihan functionality has been removed, so totalTps calculation is no longer needed
    }

    public boolean existsByUsername(String username) {
        return pegawaiRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return pegawaiRepository.existsByEmail(email);
    }

    public Map<String, Boolean> checkDuplicateData(String username, String email, String phoneNumber, String nip, Integer excludeId) {
        log.info("Checking duplicate data for username: {}, email: {}, phone: {}, nip: {}, excludeId: {}", 
                username, email, phoneNumber, nip, excludeId);
        
        Map<String, Boolean> result = new HashMap<>();
        Long excludeIdLong = excludeId != null ? excludeId.longValue() : null;
        
        // Check username
        boolean usernameExists = false;
        if (username != null && !username.trim().isEmpty()) {
            if (excludeIdLong != null) {
                usernameExists = pegawaiRepository.existsByUsernameAndIdNot(username.trim(), excludeIdLong);
            } else {
                usernameExists = pegawaiRepository.existsByUsername(username.trim());
            }
        }
        
        // Check email
        boolean emailExists = false;
        if (email != null && !email.trim().isEmpty()) {
            if (excludeIdLong != null) {
                emailExists = pegawaiRepository.existsByEmailAndIdNot(email.trim(), excludeIdLong);
            } else {
                emailExists = pegawaiRepository.existsByEmail(email.trim());
            }
        }
        
        // Check phone number
        boolean phoneExists = false;
        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            if (excludeIdLong != null) {
                phoneExists = pegawaiRepository.existsByNoTelpAndIdNot(phoneNumber.trim(), excludeIdLong);
            } else {
                phoneExists = pegawaiRepository.existsByNoTelp(phoneNumber.trim());
            }
        }
        
        // Check NIP
        boolean nipExists = false;
        if (nip != null && !nip.trim().isEmpty()) {
            if (excludeIdLong != null) {
                nipExists = pegawaiRepository.existsByNipAndIdNot(nip.trim(), excludeIdLong);
            } else {
                nipExists = pegawaiRepository.existsByNip(nip.trim());
            }
        }
        
        result.put("usernameExists", usernameExists);
        result.put("emailExists", emailExists);
        result.put("phoneExists", phoneExists);
        result.put("nipExists", nipExists);
        
        log.info("Duplicate check result: {}", result);
        return result;
    }

    private PegawaiResponse createPegawaiResponseWithLocationNames(Pegawai pegawai) {
        PegawaiResponse response = PegawaiResponse.from(pegawai);
        
        // Add location names using WilayahCacheService
        if (pegawai.getProvinsi() != null) {
            response.setProvinsiNama(wilayahCacheService.getNamaByKode(pegawai.getProvinsi()));
        }
        if (pegawai.getKota() != null) {
            response.setKotaNama(wilayahCacheService.getNamaByKode(pegawai.getKota()));
        }
        if (pegawai.getKecamatan() != null) {
            response.setKecamatanNama(wilayahCacheService.getNamaByKode(pegawai.getKecamatan()));
        }
        if (pegawai.getKelurahan() != null) {
            response.setKelurahanNama(wilayahCacheService.getNamaByKode(pegawai.getKelurahan()));
        }
        
        return response;
    }

    public List<PegawaiResponse> getPegawaiWithLocationData(
            String search, String nama, String provinsi, String kota, 
            String kecamatan, String jabatan, String status) {
        log.info("Fetching pegawai with location data - search: {}", search);
        
        return pegawaiRepository.findAll().stream()
                .filter(pegawai -> pegawai.getLatitude() != null && pegawai.getLongitude() != null && pegawai.getAlamat() != null)
                .filter(pegawai -> {
                    if (search != null && !search.trim().isEmpty()) {
                        String searchLower = search.trim().toLowerCase();
                        return pegawai.getNamaLengkap().toLowerCase().contains(searchLower) ||
                               pegawai.getUsername().toLowerCase().contains(searchLower) ||
                               pegawai.getEmail().toLowerCase().contains(searchLower);
                    }
                    return true;
                })
                .filter(pegawai -> {
                    if (nama != null && !nama.trim().isEmpty()) {
                        return pegawai.getNamaLengkap().toLowerCase().contains(nama.trim().toLowerCase());
                    }
                    return true;
                })
                .filter(pegawai -> {
                    if (provinsi != null && !provinsi.trim().isEmpty()) {
                        String provinsiNama = wilayahCacheService.getNamaByKode(pegawai.getProvinsi());
                        return provinsiNama != null && provinsiNama.toLowerCase().contains(provinsi.trim().toLowerCase());
                    }
                    return true;
                })
                .filter(pegawai -> {
                    if (kota != null && !kota.trim().isEmpty()) {
                        String kotaNama = wilayahCacheService.getNamaByKode(pegawai.getKota());
                        return kotaNama != null && kotaNama.toLowerCase().contains(kota.trim().toLowerCase());
                    }
                    return true;
                })
                .filter(pegawai -> {
                    if (kecamatan != null && !kecamatan.trim().isEmpty()) {
                        String kecamatanNama = wilayahCacheService.getNamaByKode(pegawai.getKecamatan());
                        return kecamatanNama != null && kecamatanNama.toLowerCase().contains(kecamatan.trim().toLowerCase());
                    }
                    return true;
                })
                .filter(pegawai -> {
                    if (jabatan != null && !jabatan.trim().isEmpty()) {
                        return pegawai.getJabatan() != null && 
                               pegawai.getJabatan().getNama().toLowerCase().contains(jabatan.trim().toLowerCase());
                    }
                    return true;
                })
                .filter(pegawai -> {
                    if (status != null && !status.trim().isEmpty()) {
                        return (pegawai.getIsActive() && "active".equalsIgnoreCase(status.trim())) ||
                               (!pegawai.getIsActive() && "inactive".equalsIgnoreCase(status.trim()));
                    }
                    return true;
                })
                .map(this::createPegawaiResponseWithLocationNames)
                .collect(Collectors.toList());
    }

    public PegawaiResponse resetPassword(Long pegawaiId, String currentPassword, String newPassword) {
        log.info("Resetting password for pegawai: {}", pegawaiId);
        
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new RuntimeException("Pegawai tidak ditemukan"));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, pegawai.getPassword())) {
            throw new RuntimeException("Password lama tidak benar");
        }
        
        // Update password
        pegawai.setPassword(passwordEncoder.encode(newPassword));
        pegawai.setUpdatedAt(LocalDateTime.now());
        
        Pegawai updatedPegawai = pegawaiRepository.save(pegawai);
        log.info("Password updated successfully for pegawai: {}", pegawaiId);
        
        return createPegawaiResponseWithLocationNames(updatedPegawai);
    }

    public PegawaiResponse selfUpdatePegawai(Long id, SelfUpdatePegawaiRequest request) {
        log.info("Self-updating pegawai with id: {}", id);
        
        Pegawai pegawai = pegawaiRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pegawai not found with id: " + id));

        // Check if email is being changed and already exists
        if (request.getEmail() != null && !request.getEmail().equals(pegawai.getEmail())) {
            if (pegawaiRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists: " + request.getEmail());
            }
            pegawai.setEmail(request.getEmail());
        }

        // Update allowed fields for self-update
        if (request.getNamaLengkap() != null) {
            pegawai.setNamaLengkap(request.getNamaLengkap());
        }
        if (request.getNoTelp() != null) {
            pegawai.setNoTelp(request.getNoTelp());
        }
        if (request.getNip() != null) {
            pegawai.setNip(request.getNip());
        }
        if (request.getAlamat() != null) {
            pegawai.setAlamat(request.getAlamat());
        }
        if (request.getProvinsi() != null) {
            pegawai.setProvinsi(request.getProvinsi());
        }
        if (request.getKota() != null) {
            pegawai.setKota(request.getKota());
        }
        if (request.getKecamatan() != null) {
            pegawai.setKecamatan(request.getKecamatan());
        }
        if (request.getKelurahan() != null) {
            pegawai.setKelurahan(request.getKelurahan());
        }
        if (request.getKodePos() != null) {
            pegawai.setKodePos(request.getKodePos());
        }
        if (request.getLatitude() != null) {
            pegawai.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            pegawai.setLongitude(request.getLongitude());
        }
        if (request.getPhotoUrl() != null) {
            pegawai.setPhotoUrl(request.getPhotoUrl());
            // Also update fotoKaryawan for backward compatibility
            pegawai.setFotoKaryawan(request.getPhotoUrl());
        }
        if (request.getTanggalLahir() != null) {
            pegawai.setTanggalLahir(request.getTanggalLahir());
        }
        if (request.getTanggalMasuk() != null) {
            pegawai.setTanggalMasuk(request.getTanggalMasuk());
        }
        if (request.getStatusNikah() != null) {
            pegawai.setStatusNikah(request.getStatusNikah());
        }
        if (request.getJenisKelamin() != null) {
            pegawai.setJenisKelamin(request.getJenisKelamin());
        }
        if (request.getRekening() != null) {
            pegawai.setRekening(request.getRekening());
        }

        pegawai.setUpdatedAt(LocalDateTime.now());

        Pegawai savedPegawai = pegawaiRepository.save(pegawai);
        log.info("Pegawai self-updated successfully with id: {}", savedPegawai.getId());
        
        return createPegawaiResponseWithLocationNames(savedPegawai);
    }
}
