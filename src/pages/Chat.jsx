import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { MessageSquare, Users } from 'lucide-react';
import ChatBox, { Avatar } from '@/components/chat/ChatBox';

export default function Chat() {
  const { activeCompany } = useOutletContext();
  const companyId = activeCompany?.id;
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => { api.auth.me().then(setCurrentUser); }, []);

  // Load messages just for sidebar preview
  useEffect(() => {
    if (!companyId) return;
    api.entities.ChatMessage.filter({ company_id: companyId }, 'created_date', 100).then(setMessages);
  }, [companyId]);

  const participants = [...new Map(messages.map(m => [m.sender_email, m.sender_name])).entries()];

  const headerContent = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
        <MessageSquare className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold">{activeCompany?.name} — Company Chat</p>
        <p className="text-xs text-green-500 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Live
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-background overflow-hidden">
      {/* LEFT: Participants sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border flex-col bg-card hidden md:flex">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold">Company Chat</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{activeCompany?.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {/* Active room */}
          <div className="mx-2 p-3 rounded-xl bg-primary/10 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Group Chat</p>
                <p className="text-xs text-muted-foreground truncate">
                  {messages.length > 0 ? (messages[messages.length - 1]?.content || '📎 Attachment')?.slice(0, 28) + '…' : 'No messages yet'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 px-4 mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3" /> Members ({participants.length})
            </p>
          </div>
          {participants.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4">No one has chatted yet</p>
          ) : (
            participants.map(([email, name]) => (
              <div key={email} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/40 transition-colors">
                <Avatar name={name || email} email={email} size={8} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name || email}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: ChatBox */}
      <div className="flex-1 overflow-hidden">
        {companyId ? (
          <ChatBox
            roomId={companyId}
            currentUser={currentUser}
            headerContent={headerContent}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p className="text-sm">Select a company to open chat</p>
          </div>
        )}
      </div>
    </div>
  );
}