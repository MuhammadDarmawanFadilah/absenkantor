// Utility functions for image handling

export const createPlaceholderDataURL = (width: number = 400, height: number = 300, text: string = 'No Image') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
        ${text}
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const getOptimizedImageUrl = (originalUrl: string, width?: number, quality?: number): string => {
  if (!isValidImageUrl(originalUrl)) {
    return createPlaceholderDataURL(width, width ? width * 0.75 : undefined)
  }

  // For Next.js Image component, let it handle the optimization
  return originalUrl
}

// Common placeholder images
export const PLACEHOLDER_IMAGES = {
  avatar: createPlaceholderDataURL(200, 200, 'Avatar'),
  news: createPlaceholderDataURL(400, 300, 'Berita'),
  document: createPlaceholderDataURL(300, 400, 'Dokumen'),
  general: createPlaceholderDataURL(400, 300, 'Gambar'),
}
