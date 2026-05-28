# VPS Access & SSH Hardening Documentation

**Server:** `31.97.110.194`  
**Provider:** Hostinger VPS ID `906504`  
**OS:** Ubuntu 24.04.2 LTS  
**Specs:** 4 vCPU, 16GB RAM, 200GB disk  
**Last Updated:** 2026-05-29

---

## SSH Access (Hardened)

> ⚠️ SSH port telah diganti ke **2299** dan **hanya key-based auth** yang diizinkan.

### Cara Connect

```bash
# Menggunakan Windows SSH (OpenSSH)
ssh -i "C:\Users\ndakt\.ssh\vps_absenkantor" -p 2299 root@31.97.110.194

# Menggunakan plink (setelah convert ke PPK)
plink -batch -hostkey "SHA256:vOz2D1k7pZavLLUePXnHr4c0Gkr6wKL7PAATxXbL6aA" -i "vps_absenkantor.ppk" -ssh -P 2299 root@31.97.110.194
```

### File Key

| File | Lokasi | Keterangan |
|------|--------|------------|
| Private Key (OpenSSH) | `C:\Users\ndakt\.ssh\vps_absenkantor` | Untuk `ssh` / `scp` |
| Public Key | `C:\Users\ndakt\.ssh\vps_absenkantor.pub` | Tersimpan di server |
| Server authorized_keys | `/root/.ssh/authorized_keys` | `vps-absenkantor-admin-2026` |

**Key fingerprint:** `SHA256:DPIb+ju6GMVbfvpWlXz2lOEfmm+fjcpaoTrSRckARUQ`  
**Key type:** Ed25519

### Server Host Key (Normal Mode)
```
SHA256:vOz2D1k7pZavLLUePXnHr4c0Gkr6wKL7PAATxXbL6aA
```

---

## SSH Hardening Configuration

### Yang Sudah Diterapkan (2026-05-29)

| Setting | Nilai | Keterangan |
|---------|-------|------------|
| Port | **2299** | Ganti dari default 22 |
| PasswordAuthentication | **no** | Hanya key-based |
| PermitRootLogin | **prohibit-password** | Root boleh login tapi wajib key |
| PubkeyAuthentication | **yes** | |
| MaxAuthTries | **3** | Max 3x percobaan |
| LoginGraceTime | **30** | 30 detik timeout login |
| X11Forwarding | **no** | Disabled |
| AllowTcpForwarding | **no** | Disabled |
| ClientAliveInterval | **300** | Keepalive 5 menit |

### Config Files di Server

```
/etc/ssh/sshd_config.d/
├── 50-cloud-init.conf      → PasswordAuthentication no
├── 60-cloudimg-settings.conf → Port 2299, PasswordAuthentication no, PermitRootLogin prohibit-password
└── 99-hardening.conf       → Full hardening config (canonical)

/etc/systemd/system/ssh.socket.d/
└── override.conf           → ListenStream=2299 (override default port 22)
```

### Socket Activation Override
Ubuntu 24.04 menggunakan systemd socket activation untuk SSH. Port harus diubah di socket unit:
```ini
# /etc/systemd/system/ssh.socket.d/override.conf
[Socket]
ListenStream=
ListenStream=0.0.0.0:2299
ListenStream=[::]:2299
```

---

## Hostinger Recovery Mode

Gunakan saat **tidak bisa SSH sama sekali** (lockout).

### API Credentials
```
Base URL : https://developers.hostinger.com/api/vps/v1
Token    : ggr5QPwEGHerm6vefBQNf5JeOvGtdUJVvFfj48sD97d80c52
VPS ID   : 906504
```

### Masuk Recovery Mode
```powershell
$token = "ggr5QPwEGHerm6vefBQNf5JeOvGtdUJVvFfj48sD97d80c52"
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$body = '{"root_password":"VpsNew@2026abc"}'
Invoke-RestMethod -Uri "https://developers.hostinger.com/api/vps/v1/virtual-machines/906504/recovery" -Method POST -Headers $headers -Body $body
```

### Keluar Recovery Mode
```powershell
Invoke-RestMethod -Uri "https://developers.hostinger.com/api/vps/v1/virtual-machines/906504/recovery" -Method DELETE -Headers $headers
```

### Disk Layout di Recovery Mode
```
Recovery OS : /dev/sda  (mounted at /)
Actual VPS  : /dev/sdb  (mounted at /mnt/sdb1)
```
> Edit config di `/mnt/sdb1/etc/ssh/...` bukan `/etc/ssh/...`

### Host Key Recovery Mode
```
SHA256:vygVqtFnNogax6wqouk1kvR+p/rYvwB44R2Mr6i3XSg
```

### Connect via Recovery Mode
```powershell
cmd /c "plink -batch -hostkey ""SHA256:vygVqtFnNogax6wqouk1kvR+p/rYvwB44R2Mr6i3XSg"" -ssh -pw ""VpsNew@2026abc"" root@31.97.110.194 ""command"" 2>&1"
```

---

## Password VPS (Fallback)

> ⚠️ Password auth **dinonaktifkan** di SSH. Password ini hanya untuk Hostinger console/recovery.

```
root password: VpsNew@2026abc
```

---

## UFW Firewall Rules

```
Port 80/tcp    → ALLOW IN   (nginx HTTP)
Port 443/tcp   → ALLOW IN   (nginx HTTPS)
Port 2299/tcp  → ALLOW IN   (SSH - hardened)
Port 8080/tcp   → ALLOW IN   (Tomcat - pertimbangkan untuk di-block dari internet)
Port 3000/tcp   → ALLOW IN   (Next.js absenkantor)
Port 3002/tcp   → ALLOW IN   (Next.js ikafk)
Port 3004/tcp   → ALLOW IN   (Next.js trensilapor)
Port 3005/tcp   → ALLOW IN   (Static serve)

91.208.184.203  → DENY OUT  (mining pool - malware)
156.246.94.183  → DENY OUT  (mining pool - malware)
45.196.97.119   → DENY OUT  (mining pool - malware)
```

---

## Pelajaran Penting - SSH Hardening yang Benar

> ⛔ **JANGAN** disable PasswordAuthentication sebelum SSH key ditambahkan!

### Urutan yang BENAR:
1. Generate SSH keypair: `ssh-keygen -t ed25519 -f ~/.ssh/vps_key`
2. Copy public key ke server: masukkan ke `/root/.ssh/authorized_keys`
3. **Verify key login berhasil** sebelum lanjut
4. Update SSH config: `PasswordAuthentication no`
5. Restart SSH
6. Test lagi dari session baru
7. Baru hapus rule UFW port lama

### Tambah SSH Key Baru di Masa Depan
```bash
# Di server
echo "ssh-ed25519 AAAA... komentar" >> /root/.ssh/authorized_keys
```

---

## Troubleshooting SSH

### SSH Config "First Match Wins"
Di Ubuntu, file di `/etc/ssh/sshd_config.d/` dibaca berurutan (50-... < 60-... < 99-...).  
**Setting PERTAMA yang ditemukan yang dipakai** (first match wins).  
Jadi file `50-cloud-init.conf` bisa override `99-hardening.conf` untuk setting yang sama.

### Cek Effective Config
```bash
sshd -T | grep -E 'port|passwordauth|permitroot|pubkeyauth'
```

### Cek Port yang Digunakan
```bash
ss -tlnp | grep sshd
```