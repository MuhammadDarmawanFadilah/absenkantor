package com.shadcn.backend.dto;

import java.util.List;

public class DetailLaporanRequest {
    private String judul;
    private String konten;
    private String lokasi;
    private String tanggalLaporan;
    private List<String> tempFiles;
    private Integer tahapanLaporanId;
    private Integer jenisLaporanId;
    private Integer laporanId;
    private Integer pemilihanId;
    private Integer userId;

    // Getters and Setters
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

    public List<String> getTempFiles() {
        return tempFiles;
    }

    public void setTempFiles(List<String> tempFiles) {
        this.tempFiles = tempFiles;
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
}
