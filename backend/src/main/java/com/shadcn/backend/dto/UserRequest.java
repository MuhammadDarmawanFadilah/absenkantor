package com.shadcn.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    
    @NotBlank(message = "Username tidak boleh kosong")
    @Size(min = 3, max = 50, message = "Username harus antara 3 dan 50 karakter")
    private String username;
    
    @NotBlank(message = "Email tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    private String email;
    
    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    private String fullName;
    
    @NotBlank(message = "Password tidak boleh kosong")
    @Size(min = 6, message = "Password minimal 6 karakter")
    private String password;
    
    @NotBlank(message = "Nomor handphone tidak boleh kosong")
    @Size(max = 20, message = "Nomor handphone maksimal 20 karakter")
    private String phoneNumber;
    
    @NotNull(message = "Role ID tidak boleh kosong")
    private Long roleId;
}
