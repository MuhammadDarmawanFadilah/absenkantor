package com.shadcn.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DetailLaporanResponse {
    private Integer id;
    private String judul;
    private String konten;
    private String lokasi;
    private String tanggalLaporan;
    private String status;
    private List<String> files;
    private LocalDateTime tanggalBuat;
    private Integer tahapanLaporanId;
    private Integer jenisLaporanId;
    private Integer laporanId;
    private Integer pemilihanId;
    private Integer userId;
    private String userName;
    
    // Related entity names for display
    private String pemilihanJudul;
    private String laporanNama;
    private String jenisLaporanNama;
    private String tahapanLaporanNama;

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getJudul() {
        return judul;
    }

    public void setJudul(String judul) {
        this.judul = judul;
    }

    public String getKonten() {
        return konten;
    }

    public void setKonten(String konten) {
        this.konten = konten;
    }

    public String getLokasi() {
        return lokasi;
    }

    public void setLokasi(String lokasi) {
        this.lokasi = lokasi;
    }

    public String getTanggalLaporan() {
        return tanggalLaporan;
    }

    public void setTanggalLaporan(String tanggalLaporan) {
        this.tanggalLaporan = tanggalLaporan;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getFiles() {
        return files;
    }

    public void setFiles(List<String> files) {
        this.files = files;
    }

    public LocalDateTime getTanggalBuat() {
        return tanggalBuat;
    }

    public void setTanggalBuat(LocalDateTime tanggalBuat) {
        this.tanggalBuat = tanggalBuat;
    }

    public Integer getTahapanLaporanId() {
        return tahapanLaporanId;
    }

    public void setTahapanLaporanId(Integer tahapanLaporanId) {
        this.tahapanLaporanId = tahapanLaporanId;
    }

    public Integer getJenisLaporanId() {
        return jenisLaporanId;
    }

    public void setJenisLaporanId(Integer jenisLaporanId) {
        this.jenisLaporanId = jenisLaporanId;
    }

    public Integer getLaporanId() {
        return laporanId;
    }

    public void setLaporanId(Integer laporanId) {
        this.laporanId = laporanId;
    }

    public Integer getPemilihanId() {
        return pemilihanId;
    }

    public void setPemilihanId(Integer pemilihanId) {
        this.pemilihanId = pemilihanId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPemilihanJudul() {
        return pemilihanJudul;
    }

    public void setPemilihanJudul(String pemilihanJudul) {
        this.pemilihanJudul = pemilihanJudul;
    }

    public String getLaporanNama() {
        return laporanNama;
    }

    public void setLaporanNama(String laporanNama) {
        this.laporanNama = laporanNama;
    }

    public String getJenisLaporanNama() {
        return jenisLaporanNama;
    }

    public void setJenisLaporanNama(String jenisLaporanNama) {
        this.jenisLaporanNama = jenisLaporanNama;
    }

    public String getTahapanLaporanNama() {
        return tahapanLaporanNama;
    }

    public void setTahapanLaporanNama(String tahapanLaporanNama) {
        this.tahapanLaporanNama = tahapanLaporanNama;
    }
}
