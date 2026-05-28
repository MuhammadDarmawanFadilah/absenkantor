import { useEffect, useState } from 'react'

export const useLeaflet = () => {
  const [L, setL] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsLoading(true)
    
    // Dynamic import of Leaflet
    import('leaflet').then((leafletModule) => {
      const leaflet = leafletModule.default
      
      // Fix default icon issues
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: '/images/marker-icon-2x.png',
        iconUrl: '/images/marker-icon.png',
        shadowUrl: '/images/marker-shadow.png',
      })
      
      setL(leaflet)
      setIsLoaded(true)
      setIsLoading(false)
    }).catch((error) => {
      console.error('Error loading Leaflet:', error)
      setIsLoading(false)
    })

    // Add custom styles
    if (!document.querySelector('#map-custom-styles')) {
      const style = document.createElement('style')
      style.id = 'map-custom-styles'
      style.textContent = `
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
        .leaflet-control-zoom {
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-attribution {
          font-size: 10px !important;
          background: rgba(255,255,255,0.8) !important;
          border-radius: 4px !important;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const createCustomIcon = (content: string, size: number, color?: string) => {
    if (!L) return undefined
    
    // Check if content is HTML (contains < and >)
    const isHTML = content.includes('<') && content.includes('>')
    
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isHTML ? 
            content : 
            `<div style="
              font-size: ${size * 0.8}px;
              ${color ? `color: ${color};` : ''}
              filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.7));
              ${content === '📍' ? 'animation: pulse 2s infinite;' : ''}
            ">${content}</div>`
          }
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    })
  }

  return { L, isLoaded, isLoading, createCustomIcon }
}
