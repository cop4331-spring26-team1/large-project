import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { chatApi } from '../api'
import { useAuth }   from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import type { Thread, Message } from '../types'

export default function ChatPage() {
  const { threadId }  = useParams<{ threadId?: string }>()
  const { user }      = useAuth()
  const { socket, setUnreadCount } = useSocket()

  const [threads, setThreads]     = useState<Thread[]>([])
  const [active, setActive]       = useState<Thread | null>(null)
  const [messages, setMessages]   = useState<Message[]>([])
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load threads
  useEffect(() => {
    chatApi.getThreads().then((res) => {
      const { threads: t, totalUnread: u } = res.data.data
      setThreads(t)
      setTotalUnread(u)
      setUnreadCount(u)
      if (threadId) {
        const found = t.find((th: Thread) => th._id === threadId)
        if (found) openThread(found)
      }
    })
  }, [threadId])

  // Socket — live messages
  useEffect(() => {
    if (!socket) return
    const onMsg = ({ threadId: tid, message }: { threadId: string; message: Message }) => {
      if (active?._id === tid) {
        setMessages((prev) => [...prev, message])
      }
      // Update thread preview
      setThreads((prev) => prev.map((t) =>
        t._id === tid
          ? { ...t, lastMessage: message.body, lastMessageAt: message.createdAt, unreadCount: active?._id === tid ? 0 : (t.unreadCount || 0) + 1 }
          : t
      ))
    }
    socket.on('newMessage', onMsg)
    return () => { socket.off('newMessage', onMsg) }
  }, [socket, active])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openThread = async (thread: Thread) => {
    setActive(thread)
    if (socket) {
      socket.emit('joinThread', thread._id)
    }
    const res = await chatApi.getMessages(thread._id)
    setMessages(res.data.data.messages)
    // Clear unread for this thread and update navbar badge
    const wasUnread = thread.unreadCount || 0
    setThreads((prev) => prev.map((t) => t._id === thread._id ? { ...t, unreadCount: 0 } : t))
    if (wasUnread > 0) {
      const newTotal = Math.max(0, totalUnread - wasUnread)
      setTotalUnread(newTotal)
      setUnreadCount(newTotal)
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !active || sending) return
    setSending(true)
    try {
      const res = await chatApi.sendMessage(active._id, body.trim())
      setMessages((prev) => [...prev, res.data.data.message])
      setBody('')
    } finally { setSending(false) }
  }

  const blockThread = async () => {
    if (!active) return
    await chatApi.blockThread(active._id)
    setActive((prev) => prev ? { ...prev, isBlocked: !prev.isBlocked } : prev)
  }

  const deleteThread = async () => {
    if (!active || !confirm('Remove this conversation?')) return
    await chatApi.deleteThread(active._id)
    setThreads((prev) => prev.filter((t) => t._id !== active._id))
    setActive(null)
    setMessages([])
  }

  const otherParticipant = (t: Thread) =>
    t.participants.find((p) => p._id !== user?._id)

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 960 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, marginBottom: 24 }}>
          Messages {totalUnread > 0 && <span style={styles.unreadBadge}>{totalUnread}</span>}
        </h1>

        <div style={styles.layout}>
          {/* Thread list */}
          <div style={styles.threadList}>
            {threads.length === 0 && (
              <div style={{ padding: 24, color: '#9BA3C7', fontSize: 14, textAlign: 'center' }}>
                No conversations yet.<br />Browse listings and contact a lister to start chatting.
              </div>
            )}
            {threads.map((t) => {
              const other   = otherParticipant(t)
              const isActive = active?._id === t._id
              return (
                <button
                  key={t._id}
                  style={{ ...styles.threadItem, ...(isActive ? styles.threadItemActive : {}) }}
                  onClick={() => openThread(t)}
                >
                  <div style={styles.threadAvatar}>{other?.name.charAt(0).toUpperCase()}</div>
                  <div style={styles.threadInfo}>
                    <div style={styles.threadName}>{other?.name}</div>
                    <div style={styles.threadSnippet}>
                      {t.listingSnapshot?.title}
                    </div>
                    <div style={styles.threadLast} title={t.lastMessage}>
                      {t.lastMessage || 'Start chatting'}
                    </div>
                  </div>
                  {(t.unreadCount || 0) > 0 && (
                    <div style={styles.threadUnread}>{t.unreadCount}</div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Message pane */}
          {active ? (
            <div style={styles.msgPane}>
              {/* Header */}
              <div style={styles.msgHeader}>
                <img
                  src={active.listingSnapshot?.mainImage || ''}
                  alt=""
                  style={styles.listingThumb}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div style={{ flex: 1 }}>
                  <div style={styles.msgHeaderTitle}>{active.listingSnapshot?.title}</div>
                  <div style={{ fontSize: 13, color: '#4ECDC4' }}>
                    ${active.listingSnapshot?.price?.toLocaleString()}/mo
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    style={{ ...styles.iconAction, color: active.isBlocked ? '#FF6B6B' : '#9BA3C7' }}
                    onClick={blockThread}
                    title={active.isBlocked ? 'Unblock' : 'Block conversation'}
                  >🚫</button>
                  <button style={{ ...styles.iconAction, color: '#FF6B6B' }} onClick={deleteThread} title="Delete thread">🗑</button>
                </div>
              </div>

              {/* Listing status banner */}
              {active.listingSnapshot?.status === 'offMarket' && (
                <div style={styles.offMarketBanner}>
                  🔴 This listing is no longer available
                </div>
              )}

              {/* Blocked banner */}
              {active.isBlocked && (
                <div style={styles.blockedBanner}>
                  🚫 This conversation is blocked — no new messages can be sent.
                </div>
              )}

              {/* Messages */}
              <div style={styles.messages}>
                {messages.map((m) => {
                  const isMe = m.sender._id === user?._id
                  return (
                    <div key={m._id} style={{ ...styles.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      {!isMe && (
                        <div style={styles.msgAvatar}>{m.sender.name.charAt(0)}</div>
                      )}
                      <div style={{ ...styles.bubble, ...(isMe ? styles.bubbleMe : styles.bubbleThem) }}>
                        {!isMe && <div style={styles.senderName}>{m.sender.name}</div>}
                        <div style={styles.bubbleText}>{m.body}</div>
                        <div style={styles.msgTime}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {!active.isBlocked && (
                <form onSubmit={send} style={styles.inputRow}>
                  <input
                    style={styles.msgInput}
                    placeholder="Type a message..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={sending}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !body.trim()}>
                    Send
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div style={styles.noThread}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <p style={{ color: '#9BA3C7' }}>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout:          { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0, background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden', height: 640 },
  threadList:      { borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto' },
  threadItem:      { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', width: '100%', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' },
  threadItemActive:{ background: 'rgba(78,205,196,0.08)', borderLeft: '3px solid #4ECDC4' },
  threadAvatar:    { width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#4ECDC4,#2C3E6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 },
  threadInfo:      { flex: 1, minWidth: 0 },
  threadName:      { fontSize: 14, fontWeight: 600, color: '#F0F2FF', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  threadSnippet:   { fontSize: 11, color: '#4ECDC4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 },
  threadLast:      { fontSize: 12, color: '#9BA3C7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 },
  threadUnread:    { width: 20, height: 20, borderRadius: '50%', background: '#4ECDC4', color: '#1B1F3B', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgPane:         { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  msgHeader:       { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  listingThumb:    { width: 48, height: 36, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  msgHeaderTitle:  { fontSize: 14, fontWeight: 600, color: '#F0F2FF', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  iconAction:      { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 },
  offMarketBanner: { background: 'rgba(255,107,107,0.12)', borderBottom: '1px solid rgba(255,107,107,0.2)', padding: '8px 16px', fontSize: 13, color: '#FF6B6B', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
  blockedBanner:   { background: 'rgba(255,107,107,0.08)', borderBottom: '1px solid rgba(255,107,107,0.15)', padding: '8px 16px', fontSize: 13, color: '#FF6B6B' },
  messages:        { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  msgRow:          { display: 'flex', alignItems: 'flex-end', gap: 8 },
  msgAvatar:       { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#4ECDC4,#2C3E6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 },
  bubble:          { maxWidth: '70%', borderRadius: 16, padding: '10px 14px' },
  bubbleMe:        { background: '#4ECDC4', borderBottomRightRadius: 4 },
  bubbleThem:      { background: '#252A4A', borderBottomLeftRadius: 4, border: '1px solid rgba(255,255,255,0.08)' },
  senderName:      { fontSize: 11, color: '#9BA3C7', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
  bubbleText:      { fontSize: 14, lineHeight: 1.5, color: '#F0F2FF', wordBreak: 'break-word' },
  msgTime:         { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' },
  inputRow:        { display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  msgInput:        { flex: 1, background: '#2A3055', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#F0F2FF', fontSize: 14, padding: '10px 14px', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  noThread:        { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#5C6490' },
  unreadBadge:     { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4ECDC4', color: '#1B1F3B', borderRadius: 20, fontSize: 14, fontWeight: 700, padding: '2px 10px', marginLeft: 10 },
}
