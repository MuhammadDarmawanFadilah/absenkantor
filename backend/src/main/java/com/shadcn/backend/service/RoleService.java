package com.shadcn.backend.service;

import com.shadcn.backend.dto.RoleRequest;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.Set;
import java.util.HashSet;

@Service
@Transactional
public class RoleService {
    
    @Autowired
    private RoleRepository roleRepository;
    
    // Predefined permissions based on complete menu structure from AppSidebar
    public static final Set<String> AVAILABLE_PERMISSIONS = Set.of(
        // Dashboard & Basic Access
        "dashboard.view", "admin.panel.access",
        
        // Public Menu Items (Always visible)
        "home.access",
        
        // Menu Pegawai (Visible when authenticated)
        "laporan-pengawas.read", "laporan-pengawas.create", "laporan-pengawas.update", "laporan-pengawas.delete",
        "laporan-saya.read", "laporan-saya.create", "laporan-saya.update", "laporan-saya.delete",
        "file-manager.read", "file-manager.create", "file-manager.update", "file-manager.delete",
        
        // Administrasi Pegawai
        "pegawai.read", "pegawai.create", "pegawai.update", "pegawai.delete",
        "lokasi-pegawai.read", "lokasi-pegawai.create", "lokasi-pegawai.update", "lokasi-pegawai.delete",
        "roles.read", "roles.create", "roles.update", "roles.delete",
        "file-pegawai.read", "file-pegawai.create", "file-pegawai.update", "file-pegawai.delete",
        
        // Administrasi Pemilihan  
        "pemilihan.read", "pemilihan.create", "pemilihan.update", "pemilihan.delete",
        "laporan.read", "laporan.create", "laporan.update", "laporan.delete",
        "jenis-laporan.read", "jenis-laporan.create", "jenis-laporan.update", "jenis-laporan.delete",
        "lokasi-pemilihan.read", "lokasi-pemilihan.create", "lokasi-pemilihan.update", "lokasi-pemilihan.delete",
        
        // Master Data  
        "kategori-file.read", "kategori-file.create", "kategori-file.update", "kategori-file.delete",
        "jabatan.read", "jabatan.create", "jabatan.update", "jabatan.delete",
        "wilayah-provinsi.read", "wilayah-provinsi.create", "wilayah-provinsi.update", "wilayah-provinsi.delete",
        "wilayah-kota.read", "wilayah-kota.create", "wilayah-kota.update", "wilayah-kota.delete",
        "wilayah-kecamatan.read", "wilayah-kecamatan.create", "wilayah-kecamatan.update", "wilayah-kecamatan.delete",
        "wilayah-kelurahan.read", "wilayah-kelurahan.create", "wilayah-kelurahan.update", "wilayah-kelurahan.delete"
    );
    
    // Order permissions according to sidebar structure
    public static final List<String> PERMISSION_ORDER = Arrays.asList(
        // Menu Utama
        "home.access",
        
        // Menu Pegawai
        "laporan-pengawas.read", "laporan-pengawas.create", "laporan-pengawas.update", "laporan-pengawas.delete",
        "laporan-saya.read", "laporan-saya.create", "laporan-saya.update", "laporan-saya.delete", 
        "file-manager.read", "file-manager.create", "file-manager.update", "file-manager.delete",
        
        // Administrasi Pegawai
        "pegawai.read", "pegawai.create", "pegawai.update", "pegawai.delete",
        "lokasi-pegawai.read", "lokasi-pegawai.create", "lokasi-pegawai.update", "lokasi-pegawai.delete",
        "roles.read", "roles.create", "roles.update", "roles.delete",
        "file-pegawai.read", "file-pegawai.create", "file-pegawai.update", "file-pegawai.delete",
        
        // Administrasi Pemilihan
        "pemilihan.read", "pemilihan.create", "pemilihan.update", "pemilihan.delete",
        "laporan.read", "laporan.create", "laporan.update", "laporan.delete",
        "jenis-laporan.read", "jenis-laporan.create", "jenis-laporan.update", "jenis-laporan.delete",
        "lokasi-pemilihan.read", "lokasi-pemilihan.create", "lokasi-pemilihan.update", "lokasi-pemilihan.delete",
        
        // Master Data
        "kategori-file.read", "kategori-file.create", "kategori-file.update", "kategori-file.delete",
        "jabatan.read", "jabatan.create", "jabatan.update", "jabatan.delete",
        "wilayah-provinsi.read", "wilayah-provinsi.create", "wilayah-provinsi.update", "wilayah-provinsi.delete",
        "wilayah-kota.read", "wilayah-kota.create", "wilayah-kota.update", "wilayah-kota.delete",
        "wilayah-kecamatan.read", "wilayah-kecamatan.create", "wilayah-kecamatan.update", "wilayah-kecamatan.delete",
        "wilayah-kelurahan.read", "wilayah-kelurahan.create", "wilayah-kelurahan.update", "wilayah-kelurahan.delete",
        
        // System
        "dashboard.view", "admin.panel.access"
    );
      public List<Role> getAllRoles() {
        return roleRepository.findAllOrderByName();
    }
    
    public Page<Role> getAllRoles(int page, int size, String search, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        if (search != null && !search.trim().isEmpty()) {
            return roleRepository.findByRoleNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                search.trim(), search.trim(), pageable);
        } else {
            return roleRepository.findAll(pageable);
        }
    }
    
    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }
    
    public Optional<Role> getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName);
    }
    
    public Role createRole(RoleRequest request) {
        if (roleRepository.existsByRoleName(request.getRoleName())) {
            throw new RuntimeException("Role dengan nama '" + request.getRoleName() + "' sudah ada");
        }
        
        Role role = new Role();
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        
        // Validate permissions
        Set<String> validPermissions = new HashSet<>();
        for (String permission : request.getPermissions()) {
            if (AVAILABLE_PERMISSIONS.contains(permission)) {
                validPermissions.add(permission);
            }
        }
        role.setPermissions(validPermissions);
        
        return roleRepository.save(role);
    }
    
    public Role updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Role tidak ditemukan"));
        
        // Check if new name already exists (excluding current role)
        if (!role.getRoleName().equals(request.getRoleName()) && 
            roleRepository.existsByRoleName(request.getRoleName())) {
            throw new RuntimeException("Role dengan nama '" + request.getRoleName() + "' sudah ada");
        }
        
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        
        // Validate permissions
        Set<String> validPermissions = new HashSet<>();
        for (String permission : request.getPermissions()) {
            if (AVAILABLE_PERMISSIONS.contains(permission)) {
                validPermissions.add(permission);
            }
        }
        role.setPermissions(validPermissions);
        
        return roleRepository.save(role);
    }
    
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Role tidak ditemukan"));
        roleRepository.delete(role);
    }
    
    public List<Role> searchRoles(String name) {
        if (name == null || name.trim().isEmpty()) {
            return getAllRoles();
        }
        return roleRepository.findByRoleNameContainingIgnoreCase(name.trim());
    }
    
    public Set<String> getAvailablePermissions() {
        // Return permissions in the order defined by PERMISSION_ORDER
        return new java.util.LinkedHashSet<>(PERMISSION_ORDER);
    }
    
    public void initializeDefaultRoles() {
        // Create ADMIN role if not exists
        if (!roleRepository.existsByRoleName("ADMIN")) {
            Role adminRole = new Role();
            adminRole.setRoleName("ADMIN");
            adminRole.setDescription("Administrator dengan akses penuh ke semua fitur sistem");
            adminRole.setPermissions(new HashSet<>(AVAILABLE_PERMISSIONS));
            roleRepository.save(adminRole);
        }
        
        // Create VERIFICATOR role if not exists
        if (!roleRepository.existsByRoleName("VERIFICATOR")) {
            Role verificatorRole = new Role();
            verificatorRole.setRoleName("VERIFICATOR");
            verificatorRole.setDescription("Verificator dengan akses admin terbatas");
            verificatorRole.setPermissions(Set.of(
                "dashboard.view", "admin.panel.access", "home.access",
                "laporan-pengawas.read", "laporan-saya.read", "file-manager.read",
                "pegawai.read", "pegawai.update", "lokasi-pegawai.read", "roles.read", "file-pegawai.read",
                "pemilihan.read", "laporan.read", "jenis-laporan.read", "lokasi-pemilihan.read",
                "kategori-file.read", "jabatan.read", 
                "wilayah-provinsi.read", "wilayah-kota.read", "wilayah-kecamatan.read", "wilayah-kelurahan.read"
            ));
            roleRepository.save(verificatorRole);
        }
        
        // Create PEGAWAI role if not exists
        if (!roleRepository.existsByRoleName("PEGAWAI")) {
            Role pegawaiRole = new Role();
            pegawaiRole.setRoleName("PEGAWAI");
            pegawaiRole.setDescription("Pegawai dengan akses ke fitur pegawai");
            pegawaiRole.setPermissions(Set.of(
                "dashboard.view", "home.access",
                "laporan-pengawas.read", "laporan-saya.read", "laporan-saya.create", "laporan-saya.update",
                "file-manager.read", "file-manager.create", "file-manager.update"
            ));
            roleRepository.save(pegawaiRole);
        }
    }
}
