'use client'

import { useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface PusherHookProps {
  onCutiRequest?: (data: any) => void
  onCutiResponse?: (data: any) => void
}

export const usePusherNotifications = ({ onCutiRequest, onCutiResponse }: PusherHookProps = {}) => {
  const { user } = useAuth()
  const pusherRef = useRef<Pusher | null>(null)
  const channelsRef = useRef<string[]>([])
  const isConnectingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (pusherRef.current) {
      try {
        // Unsubscribe from all channels
        channelsRef.current.forEach(channel => {
          try {
            pusherRef.current?.unsubscribe(channel)
          } catch (error) {
            console.warn(`Failed to unsubscribe from channel ${channel}:`, error)
          }
        })
        
        // Clear channels list
        channelsRef.current = []
        
        // Disconnect if connection is not already closed
        if (pusherRef.current.connection.state !== 'disconnected' && 
            pusherRef.current.connection.state !== 'disconnecting') {
          pusherRef.current.disconnect()
        }
      } catch (error) {
        console.warn('Error during Pusher cleanup:', error)
      } finally {
        pusherRef.current = null
        isConnectingRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    if (!user || isConnectingRef.current) return

    // Cleanup existing connection
    cleanup()

    isConnectingRef.current = true

    try {
      // Initialize Pusher with better configuration
      const pusher = new Pusher('e3b5f90419b058345c0d', {
        cluster: 'ap1',
        forceTLS: true,
        enabledTransports: ['ws', 'wss'],
        disabledTransports: [],
        activityTimeout: 120000,
        pongTimeout: 30000,
        unavailableTimeout: 10000
      })

      pusherRef.current = pusher
      isConnectingRef.current = false

      // Handle connection events
      pusher.connection.bind('connected', () => {
        console.log('Pusher connected successfully')
      })

      pusher.connection.bind('disconnected', () => {
        console.log('Pusher disconnected')
      })

      pusher.connection.bind('error', (error: any) => {
        console.error('Pusher connection error:', error)
      })

      // Subscribe to admin channel for cuti requests (for admins)
      if (user.role?.roleName === 'ADMIN') {
        try {
          const adminChannel = pusher.subscribe('admin-channel')
          channelsRef.current.push('admin-channel')
          
          adminChannel.bind('cuti-request', (data: any) => {
            toast.info(`📋 Pengajuan cuti baru dari ${data.pegawaiName}`, {
              description: `${data.cutiCount} hari cuti (${data.startDate} - ${data.endDate})`,
              action: {
                label: 'Lihat',
                onClick: () => {
                  window.location.href = '/admin/master-data/cuti'
                }
              },
              duration: 10000
            })
            
            // Call custom handler if provided
            onCutiRequest?.(data)
          })

          console.log('Subscribed to admin-channel')
        } catch (error) {
          console.error('Error subscribing to admin channel:', error)
        }
      }

      // Subscribe to personal channel for cuti responses (for pegawai)
      try {
        const personalChannelName = `pegawai-${user.id}`
        const personalChannel = pusher.subscribe(personalChannelName)
        channelsRef.current.push(personalChannelName)
        
        personalChannel.bind('cuti-response', (data: any) => {
          const isApproved = data.status === 'DISETUJUI'
          
          toast[isApproved ? 'success' : 'error'](
            `${data.message}`,
            {
              description: `Tanggal: ${data.tanggalCuti}${data.catatan ? ` | Catatan: ${data.catatan}` : ''}`,
              action: {
                label: 'Lihat Detail',
                onClick: () => {
                  window.location.href = '/pegawai/cuti'
                }
              },
              duration: 10000
            }
          )
          
          // Call custom handler if provided
          onCutiResponse?.(data)
        })

        console.log(`Subscribed to ${personalChannelName}`)
      } catch (error) {
        console.error('Error subscribing to personal channel:', error)
      }

    } catch (error) {
      console.error('Error initializing Pusher:', error)
      isConnectingRef.current = false
    }

    // Cleanup function
    return cleanup
  }, [user?.id, user?.role?.roleName, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return pusherRef.current
}
