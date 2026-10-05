import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { connectSocket } from '@/lib/socket';
import {
  Send, Image, Smile, Mic, MicOff, Reply, Trash2, X,
  Search, Download, FileText, CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';

const EMOJIS = ['😀','😂','😍','🥰','😎','😢','😡','👍','👎','❤️','🔥','🎉','💯','🙏','😮','😱','🤔','💪','👋','✅'];
const QUICK_REACTIONS = ['❤️','😂','👍','😮','😢','🙏'];

function Avatar({ name, email, size = 9 }) {
  const label = name || email || '?';
  const initials = label.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-pink-500','bg-orange-500','bg-cyan-500','bg-rose-500','bg-indigo-500'];
  const color = colors[(label.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 select-none`}>
      {initials}
    </div>
  );
}

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'hh:mm a');
}

function getDayLabel(day) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const yDate = new Date(now); yDate.setDate(now.getDate() - 1);
  const yStr = `${yDate.getFullYear()}-${pad(yDate.getMonth()+1)}-${pad(yDate.getDate())}`;
  if (day === today) return 'Today';
  if (day === yStr) return 'Yesterday';
  return format(new Date(day + 'T12:00:00'), 'MMMM d, yyyy');
}

function groupByDate(messages) {
  return messages.reduce((acc, msg) => {
    const d = new Date(msg.created_date || msg.createdAt);
    if (isNaN(d)) return acc;
    const pad = n => String(n).padStart(2, '0');
    const day = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});
}

export default function ChatBox({ roomId, currentUser, headerContent, onBack }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [connected, setConnected] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const socketRef = useRef(null);

  // Load history + connect socket
  useEffect(() => {
    if (!roomId) { setMessages([]); return; }

    // Load message history via REST
    api.entities.ChatMessage.filter({ company_id: roomId }, 'created_date', 200).then(setMessages);

    // Connect socket
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', roomId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg) => {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
    });

    socket.on('message_deleted', (msgId) => {
      setMessages(prev => prev.filter(m => m.id !== msgId && m._id !== msgId));
    });

    socket.on('message_updated', (updated) => {
      setMessages(prev => prev.map(m => (m.id === updated.id || m._id === updated._id) ? { ...m, ...updated } : m));
    });

    // Trigger connect if not already connected
    if (!socket.connected) socket.connect();

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_message');
      socket.off('message_deleted');
      socket.off('message_updated');
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close popups on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.emoji-panel') && !e.target.closest('.emoji-btn')) setShowEmoji(false);
      if (!e.target.closest('.reaction-panel') && !e.target.closest('.react-btn')) setShowReactionPicker(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendMessage = useCallback(async (extra = {}) => {
    const text = message.trim();
    if (!text && !extra.file_url && !extra.audio_url) return;
    if (!currentUser || !roomId) return;

    setMessage('');
    setReplyTo(null);
    setShowEmoji(false);

    const payload = {
      company_id: roomId,
      content: text,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name || currentUser.email,
      reply_to_id: replyTo?.id || null,
      reply_to_content: replyTo?.content || null,
      reply_to_sender: replyTo?.sender_name || null,
      ...extra,
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', payload);
    } else {
      // Fallback to REST if socket not connected
      const msg = await api.entities.ChatMessage.create(payload);
      setMessages(prev => [...prev, msg]);
    }
  }, [message, currentUser, roomId, replyTo]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') setReplyTo(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    await sendMessage({ file_url, file_name: file.name });
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = (msgId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('delete_message', { messageId: msgId, company_id: roomId });
    } else {
      api.entities.ChatMessage.delete(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    }
  };

  const handleReaction = (msg, emoji) => {
    const reactions = msg.reactions || {};
    const me = currentUser.email;
    const existing = reactions[emoji] || [];
    const updated = existing.includes(me) ? existing.filter(e => e !== me) : [...existing, me];
    const newReactions = { ...reactions, [emoji]: updated };
    if (newReactions[emoji].length === 0) delete newReactions[emoji];

    if (socketRef.current?.connected) {
      socketRef.current.emit('update_reactions', { messageId: msg.id || msg._id, reactions: newReactions, company_id: roomId });
    } else {
      api.entities.ChatMessage.update(msg.id, { reactions: newReactions });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: newReactions } : m));
    }
    setShowReactionPicker(null);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    const chunks = [];
    mr.ondataavailable = e => chunks.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
      setUploading(true);
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      await sendMessage({ audio_url: file_url, content: '🎤 Voice message' });
      setUploading(false);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    setMediaRecorder(mr);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setMediaRecorder(null);
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const grouped = groupByDate(filteredMessages);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground mr-1">
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1">{headerContent}</div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`} title={connected ? 'Connected' : 'Reconnecting...'} />
          <button onClick={() => setShowSearch(s => !s)} className={`p-2 rounded-lg hover:bg-muted transition-colors ${showSearch ? 'bg-muted' : ''}`}>
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-card flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {searchQuery && <p className="text-xs text-muted-foreground mt-1">{filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}</p>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5" style={{ background: 'hsl(var(--background))' }}>
        {Object.entries(grouped).map(([day, dayMsgs]) => (
          <div key={day}>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full border border-border">{getDayLabel(day)}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {dayMsgs.map((msg, i) => {
              const isMe = msg.sender_email === currentUser?.email;
              const prevMsg = dayMsgs[i - 1];
              const sameAsPrev = prevMsg?.sender_email === msg.sender_email;
              const reactions = msg.reactions || {};
              const hasReactions = Object.keys(reactions).length > 0;
              const isHighlighted = searchQuery && msg.content?.toLowerCase().includes(searchQuery.toLowerCase());
              const msgId = msg.id || msg._id;

              return (
                <div
                  key={msgId}
                  className={`group flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${sameAsPrev ? 'mt-0.5' : 'mt-3'} ${isHighlighted ? 'bg-yellow-100/30 rounded-xl px-2' : ''}`}
                  onMouseEnter={() => setHoveredMsg(msgId)}
                  onMouseLeave={() => setHoveredMsg(null)}
                >
                  {!isMe && !sameAsPrev && <Avatar name={msg.sender_name} email={msg.sender_email} size={9} />}
                  {!isMe && sameAsPrev && <div className="w-9 flex-shrink-0" />}

                  <div className={`relative max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && !sameAsPrev && (
                      <p className="text-[11px] font-semibold text-muted-foreground mb-0.5 ml-1">{msg.sender_name || msg.sender_email}</p>
                    )}

                    {msg.reply_to_id && (
                      <div className={`mb-1 px-3 py-1.5 rounded-xl text-xs border-l-2 border-primary bg-muted max-w-full ${isMe ? 'self-end' : 'self-start'}`}>
                        <p className="font-semibold text-primary truncate">{msg.reply_to_sender}</p>
                        <p className="text-muted-foreground truncate">{msg.reply_to_content?.slice(0, 60)}</p>
                      </div>
                    )}

                    <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
                      ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border text-foreground rounded-bl-sm'}`}
                    >
                      {msg.audio_url && (
                        <div className="flex items-center gap-2 min-w-[160px]">
                          <Mic className="w-4 h-4 flex-shrink-0 opacity-70" />
                          <audio controls className="h-8 w-full" style={{ maxWidth: 200 }} src={msg.audio_url} />
                        </div>
                      )}
                      {msg.file_url && (
                        <a href={msg.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline hover:opacity-80">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate max-w-[160px]">{msg.file_name || 'Download file'}</span>
                          <Download className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                      )}
                      {msg.content && !(msg.audio_url && msg.content === '🎤 Voice message') && (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>

                    {hasReactions && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(reactions).map(([emoji, users]) =>
                          users.length > 0 && (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg, emoji)}
                              title={users.join(', ')}
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors
                                ${users.includes(currentUser?.email) ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted border-border text-foreground hover:bg-muted/80'}`}
                            >
                              {emoji} <span className="font-medium">{users.length}</span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                    <p className={`text-[10px] text-muted-foreground mt-0.5 px-0.5 flex items-center gap-0.5 ${isMe ? 'justify-end' : ''}`}>
                      {formatMsgTime(msg.created_date || msg.createdAt)}
                      {isMe && <CheckCheck className="w-3 h-3 text-blue-400 ml-0.5" />}
                    </p>
                  </div>

                  {hoveredMsg === msgId && (
                    <div className={`flex items-center gap-0.5 flex-shrink-0 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="relative">
                        <button
                          className="react-btn p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === msgId ? null : msgId); }}
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        {showReactionPicker === msgId && (
                          <div className={`reaction-panel absolute z-20 bottom-8 ${isMe ? 'right-0' : 'left-0'} bg-card border border-border rounded-2xl shadow-xl p-2 flex gap-1`}>
                            {QUICK_REACTIONS.map(e => (
                              <button key={e} onClick={() => handleReaction(msg, e)} className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-muted">{e}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      {isMe && (
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(msgId)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {messages.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 pt-24">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Send className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs">Send the first message!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-muted/50 flex-shrink-0">
          <div className="w-0.5 h-8 bg-primary rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary">{replyTo.sender_name}</p>
            <p className="text-xs text-muted-foreground truncate">{replyTo.content?.slice(0, 60)}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="relative flex-shrink-0">
            <button className="emoji-btn p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setShowEmoji(s => !s)}>
              <Smile className="w-5 h-5" />
            </button>
            {showEmoji && (
              <div className="emoji-panel absolute bottom-12 left-0 z-30 bg-card border border-border rounded-2xl shadow-xl p-3 w-72">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { setMessage(m => m + e); inputRef.current?.focus(); }}
                      className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted">{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
            {uploading ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Image className="w-5 h-5" />}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" className="hidden" onChange={handleFileUpload} />

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2.5 text-sm bg-muted rounded-2xl border-0 outline-none resize-none focus:ring-1 focus:ring-ring leading-relaxed max-h-32 overflow-auto"
              style={{ minHeight: 40 }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
            />
          </div>

          {message.trim() ? (
            <button onClick={() => sendMessage()} className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0 shadow-sm">
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onMouseDown={startRecording} onMouseUp={stopRecording}
              onTouchStart={startRecording} onTouchEnd={stopRecording}
              className={`p-2.5 rounded-full transition-colors flex-shrink-0 shadow-sm ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            >
              {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>
        {recording && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording... Release to send
          </p>
        )}
      </div>
    </div>
  );
}

export { Avatar };
