package com.shadcn.backend.dto;

public class DetailPemilihanDTO {
    private Long detailPemilihanId;
    private Long laporanId;
    private String namaCandidat;
    private String partai;
    private String fotoPath;
    private Integer urutanTampil;
    private Integer posisiLayout;
    private String keterangan;
    private String jenisLaporan;
    private String status;

    // Constructors
    public DetailPemilihanDTO() {}

    public DetailPemilihanDTO(Long detailPemilihanId, Long laporanId, String namaCandidat, 
                             String partai, String fotoPath, Integer urutanTampil, 
                             Integer posisiLayout, String keterangan, String jenisLaporan, String status) {
        this.detailPemilihanId = detailPemilihanId;
        this.laporanId = laporanId;
        this.namaCandidat = namaCandidat;
        this.partai = partai;
        this.fotoPath = fotoPath;
        this.urutanTampil = urutanTampil;
        this.posisiLayout = posisiLayout;
        this.keterangan = keterangan;
        this.jenisLaporan = jenisLaporan;
        this.status = status;
    }

    // Getters and Setters
    public Long getDetailPemilihanId() {
        return detailPemilihanId;
    }

    public void setDetailPemilihanId(Long detailPemilihanId) {
        this.detailPemilihanId = detailPemilihanId;
    }

    public Long getLaporanId() {
        return laporanId;
    }

    public void setLaporanId(Long laporanId) {
        this.laporanId = laporanId;
    }

    public String getNamaCandidat() {
        return namaCandidat;
    }

    public void setNamaCandidat(String namaCandidat) {
        this.namaCandidat = namaCandidat;
    }

    public String getPartai() {
        return partai;
    }

    public void setPartai(String partai) {
        this.partai = partai;
    }

    public String getFotoPath() {
        return fotoPath;
    }

    public void setFotoPath(String fotoPath) {
        this.fotoPath = fotoPath;
    }

    public Integer getUrutanTampil() {
        return urutanTampil;
    }

    public void setUrutanTampil(Integer urutanTampil) {
        this.urutanTampil = urutanTampil;
    }

    public Integer getPosisiLayout() {
        return posisiLayout;
    }

    public void setPosisiLayout(Integer posisiLayout) {
        this.posisiLayout = posisiLayout;
    }

    public String getKeterangan() {
        return keterangan;
    }

    public void setKeterangan(String keterangan) {
        this.keterangan = keterangan;
    }

    public String getJenisLaporan() {
        return jenisLaporan;
    }

    public void setJenisLaporan(String jenisLaporan) {
        this.jenisLaporan = jenisLaporan;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
