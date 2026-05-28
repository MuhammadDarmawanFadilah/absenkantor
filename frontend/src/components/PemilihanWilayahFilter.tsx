'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getApiUrl } from "@/lib/config"

interface WilayahProvinsi {
  kode: string
  nama: string
}

interface WilayahKota {
  kode: string
  nama: string
  provinsiKode: string
}

interface WilayahKecamatan {
  kode: string
  nama: string
  kotaKode: string
}

interface PemilihanWilayahFilterProps {
  provinsiValue: string
  kotaValue: string
  kecamatanValue: string
  onProvinsiChange: (value: string) => void
  onKotaChange: (value: string) => void
  onKecamatanChange: (value: string) => void
}

export function PemilihanWilayahFilter({
  provinsiValue,
  kotaValue,
  kecamatanValue,
  onProvinsiChange,
  onKotaChange,
  onKecamatanChange
}: PemilihanWilayahFilterProps) {
  const [provinsiList, setProvinsiList] = useState<WilayahProvinsi[]>([])
  const [kotaList, setKotaList] = useState<WilayahKota[]>([])
  const [kecamatanList, setKecamatanList] = useState<WilayahKecamatan[]>([])
  const [loading, setLoading] = useState(false)
  
  // Store selected kode values for API calls
  const [selectedProvinsiKode, setSelectedProvinsiKode] = useState('')
  const [selectedKotaKode, setSelectedKotaKode] = useState('')

  // Load provinces on component mount
  useEffect(() => {
    loadProvinsi()
  }, [])

  // Load cities when province changes
  useEffect(() => {
    if (provinsiValue) {
      loadKota(provinsiValue)
    } else {
      setKotaList([])
      setKecamatanList([])
      onKotaChange('')
      onKecamatanChange('')
    }
  }, [provinsiValue])

  // Load districts when city changes
  useEffect(() => {
    if (kotaValue) {
      loadKecamatan(kotaValue)
    } else {
      setKecamatanList([])
      onKecamatanChange('')
    }
  }, [kotaValue])

  const loadProvinsi = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/provinsi?size=1000`)
      if (response.ok) {
        const data = await response.json()
        setProvinsiList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading provinsi:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadKota = async (provinsiKode: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kota?provinsiKode=${provinsiKode}&size=1000`)
      if (response.ok) {
        const data = await response.json()
        setKotaList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading kota:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadKecamatan = async (kotaKode: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${getApiUrl('/admin/wilayah')}/kecamatan?kotaKode=${kotaKode}&size=1000`)
      if (response.ok) {
        const data = await response.json()
        setKecamatanList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading kecamatan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProvinsiChange = (value: string) => {
    onProvinsiChange(value)
    // Reset dependent filters
    onKotaChange('')
    onKecamatanChange('')
  }

  const handleKotaChange = (value: string) => {
    onKotaChange(value)
    // Reset dependent filters
    onKecamatanChange('')
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Filter Provinsi</Label>
        <Select value={provinsiValue} onValueChange={handleProvinsiChange}>
          <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Pilih provinsi..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">🌐 Semua Provinsi</SelectItem>
            {provinsiList.map((provinsi) => (
              <SelectItem key={provinsi.kode} value={provinsi.nama}>
                {provinsi.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Filter Kota/Kabupaten</Label>
        <Select 
          value={kotaValue} 
          onValueChange={handleKotaChange}
          disabled={!provinsiValue || loading}
        >
          <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={
              !provinsiValue ? "Pilih provinsi dulu..." : 
              loading ? "Loading..." : 
              "Pilih kota/kabupaten..."
            } />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">🏙️ Semua Kota/Kabupaten</SelectItem>
            {kotaList.map((kota) => (
              <SelectItem key={kota.kode} value={kota.nama}>
                {kota.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Filter Kecamatan</Label>
        <Select 
          value={kecamatanValue} 
          onValueChange={onKecamatanChange}
          disabled={!kotaValue || loading}
        >
          <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder={
              !kotaValue ? "Pilih kota dulu..." : 
              loading ? "Loading..." : 
              "Pilih kecamatan..."
            } />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">🏘️ Semua Kecamatan</SelectItem>
            {kecamatanList.map((kecamatan) => (
              <SelectItem key={kecamatan.kode} value={kecamatan.nama}>
                {kecamatan.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
