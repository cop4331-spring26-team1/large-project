import {
  createContext, useContext, useEffect,
  useRef, useState, type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  unreadCount: number
  setUnreadCount: (n: number) => void
  activeThreadId: string | null
  setActiveThreadId: (id: string | null) => void
}

const SocketContext = createContext<SocketContextType | null>(null)

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || (import.meta.env.PROD ? '' : 'http://localhost:5000')

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const activeThreadIdRef = useRef<string | null>(null)

  const handleSetActiveThreadId = (id: string | null) => {
    activeThreadIdRef.current = id
    setActiveThreadId(id)
  }

  useEffect(() => {
    // Connect for everyone — guests get broadcasts, auth users get personal events too
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = io(SOCKET_URL, { auth: { userId: user?._id ?? null } } as any)

    s.on('connect', () => {
      setSocket(s) // triggers re-render so consumers get the real socket
    })

    // Live unread badge — fires on any page when a new message arrives
    s.on('newMessage', ({ threadId }: { threadId: string }) => {
      if (activeThreadIdRef.current !== threadId) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    socketRef.current = s

    return () => {
      s.disconnect()
      socketRef.current = null
      setSocket(null)
      setUnreadCount(0)
    }
  }, [isAuthenticated, user])

  return (
    <SocketContext.Provider value={{
      socket,
      unreadCount,
      setUnreadCount,
      activeThreadId,
      setActiveThreadId: handleSetActiveThreadId,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
