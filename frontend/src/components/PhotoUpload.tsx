"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { getApiUrl } from "@/lib/config";
import { toast } from "sonner";

interface PhotoUploadProps {
  value?: string;
  onChange: (value: string) => void;
  preview?: string;
  onPreviewChange?: (preview: string) => void;
}

export default function PhotoUpload({ value, onChange, preview, onPreviewChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan (JPG, PNG, GIF)');
      return;
    }    

    // Validate file size (max 5MB)
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || '5242880');
    const maxSizeMB = process.env.NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB || '5';
    if (file.size > maxSize) {
      toast.error(`Ukuran file maksimal ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      // Create immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setLocalPreview(previewUrl);
        if (onPreviewChange) {
          onPreviewChange(previewUrl);
        }
      };
      reader.readAsDataURL(file);      

      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);

      const uploadEndpoint = getApiUrl('api/upload/photo');
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal mengupload foto');
      }

      const result = await response.json();
      
      // Store just the filename from backend
      onChange(result.filename);
      // Clear local preview after successful upload
      setLocalPreview('');
      
      toast.success('Foto berhasil diupload!');    
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal mengupload foto. Silakan coba lagi.';
      toast.error(errorMsg);
      
      // Clear preview on error
      setLocalPreview('');
      if (onPreviewChange) {
        onPreviewChange('');
      }
    } finally {
      setUploading(false);
    }
  };  const clearPhoto = () => {
    onChange('');
    if (onPreviewChange) {
      onPreviewChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const displayImage = (() => {
    // Always prioritize localPreview (base64 data from file reader)
    if (localPreview && localPreview.trim() !== "") {
      return localPreview;
    }
    
    // Then check for external preview prop
    if (preview && preview.trim() !== "") {
      return preview;
    }
    
    // Handle stored value
    if (value && value.trim() !== "") {
      // If it's already a complete URL (http/https), use it directly
      if (value.startsWith('http')) {
        return value;
      }
      
      // If it's base64 data, use it directly
      if (value.startsWith('data:')) {
        return value;
      }
      
      // For all other cases (filename or path), construct the full backend URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      
      // Debug logging for production issues
      if (process.env.NODE_ENV === 'production') {
        console.debug('PhotoUpload URL construction:', {
          value,
          backendUrl,
          fullUrl: `${backendUrl}/api/upload/photos/${value}`
        });
      }
      
      // If value starts with /api, append to backend URL
      if (value.startsWith('/api')) {
        return `${backendUrl}${value}`;
      }
      
      // If it's just a filename, construct the photo endpoint path
      return `${backendUrl}/api/upload/photos/${value}`;
    }
    
    return null;
  })();

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Circular Photo Display with Professional Styling */}
      <div className="relative group">
        <div 
          className="w-32 h-32 rounded-full border-3 border-slate-200 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-xl hover:scale-105 shadow-lg"
          onClick={() => fileInputRef.current?.click()}
        >
          {displayImage ? (
            <img 
              src={displayImage} 
              alt="Foto Profil" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-500 font-medium">Tambah Foto</span>
              </div>
            </div>
          )}
          
          {/* Professional Overlay with Camera Icon */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-full">
            <div className="text-center text-white">
              <Camera className="w-6 h-6 mx-auto mb-1 drop-shadow-lg" />
              <span className="text-xs font-medium drop-shadow-lg">
                {displayImage ? 'Ubah Foto' : 'Pilih Foto'}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Loading Indicator */}
        {uploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-xs text-slate-600 font-medium">Mengupload...</span>
            </div>
          </div>
        )}

        {/* Professional Delete Button */}
        {(value || preview) && !uploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearPhoto();
            }}
            className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white"
            title="Hapus foto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Professional Instructions */}
      <div className="text-center max-w-xs">
        <p className="text-sm font-semibold text-slate-700 mb-1">
          {displayImage ? 'Klik foto untuk mengubah' : 'Klik untuk menambah foto profil'}
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
          <span className="px-2 py-1 bg-slate-100 rounded-full">JPG, PNG</span>
          <span>•</span>
          <span className="px-2 py-1 bg-slate-100 rounded-full">Maks 5MB</span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
