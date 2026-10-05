// import React, { useState, useMemo, useEffect } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { api } from '@/api/apiClient';
// import { MessageSquare, Users, Search } from 'lucide-react';
// import { Input } from '@/components/ui/input';
// import ChatBox, { Avatar } from '@/components/chat/ChatBox';
// import { io } from "socket.io-client";

// const socket = io("https://investor-api.moduleminds.ltd", {
//   auth: {
//     token: localStorage.getItem("token"),
//   },
// });
// socket.on("connect", () => {
//   console.log("SOCKET CONNECTED");
// });

// socket.on("connect_error", err => {
//   console.log(err.message);
// });

// function dmRoomId(emailA, emailB) {
//   return 'dm_' + [emailA, emailB].sort().join('__');
// }

// export default function PersonalChat({ currentUser, companies }) {

//   const [selectedUser, setSelectedUser] = useState(null);
//   const [search, setSearch] = useState('');
//   const [onlineUsers, setOnlineUsers] = useState([]);
//   socket.on("user-online", email => {

//     console.log("ONLINE USER =>", email);

//     socket.email = email;

//     onlineUsers.add(email);

//     io.emit(
//       "online-users",
//       Array.from(onlineUsers)
//     );
//   });
//   const isUserOnline = email => {
//     return onlineUsers.includes(email);
//   };

//   useEffect(() => {

//     if (currentUser?.email) {
//       socket.emit(
//         "user-online",
//         currentUser.email
//       );
//     }

//     socket.on("online-users", users => {
//       setOnlineUsers(users);
//     });

//     return () => {
//       socket.off("online-users");
//     };

//   }, [currentUser]);
//   // LOAD CONTACTS
//   const { data: contacts = [] } = useQuery({
//     queryKey: ['personal-chat-contacts', currentUser?.email],

//     queryFn: async () => {

//       if (!currentUser?.email) return [];

//       const map = new Map();

//       // STEP 1
//       // PEOPLE ADDED IN MY COMPANIES

//       const myCompanies = companies || [];

//       const investorResults = await Promise.all(
//         myCompanies.map(c =>
//           api.entities.Investor.filter({
//             company_id: c.id,
//           })
//         )
//       );

//       investorResults.flat().forEach(inv => {

//         const email =
//           inv.user_email ||
//           inv.email;

//         if (
//           email &&
//           email !== currentUser.email
//         ) {
//           map.set(email, {
//             email,
//             name: inv.name || email,
//           });
//         }
//       });



//       // STEP 2
//       // COMPANIES WHERE I AM INVESTOR

//       const allCompanies = await api.entities.Company.list();

//       const relatedCompanies = await Promise.all(
//         allCompanies.map(async company => {

//           const investors =
//             await api.entities.Investor.filter({
//               company_id: company.id,
//             });

//           const exists = investors.find(inv => {

//             const email =
//               inv.user_email ||
//               inv.email;

//             return email === currentUser.email;
//           });

//           if (exists) {
//             return company;
//           }

//           return null;
//         })
//       );

//       relatedCompanies
//         .filter(Boolean)
//         .forEach(company => {

//           const ownerEmail =
//             company.created_by ||
//             company.user_email ||
//             company.email;

//           if (
//             ownerEmail &&
//             ownerEmail !== currentUser.email
//           ) {
//             map.set(ownerEmail, {
//               email: ownerEmail,
//               name: company.name || ownerEmail,
//             });
//           }
//         });

//       return Array.from(map.values());
//     },

//     enabled: true,
//     initialData: [],
//   });

//   // FILTER CONTACTS

//   const filteredContacts = search
//     ? contacts.filter(c =>
//       c.name.toLowerCase().includes(search.toLowerCase()) ||
//       c.email.toLowerCase().includes(search.toLowerCase())
//     )
//     : contacts;

//   // ROOM ID

//   const roomId = selectedUser
//     ? dmRoomId(currentUser?.email, selectedUser.email)
//     : null;

//   // HEADER

//   const headerContent = selectedUser ? (
//     <div className="flex items-center gap-3">
//       <Avatar
//         name={selectedUser.name}
//         email={selectedUser.email}
//         size={9}
//       />

//       <div>
//         <p className="text-sm font-semibold">
//           {selectedUser.name}
//         </p>

//         <p
//           className={`text-[10px] font-medium flex items-center gap-1 ${isUserOnline(selectedUser.email)
//               ? "text-green-500"
//               : "text-gray-400"
//             }`}
//         >
//           <span
//             className={`w-1.5 h-1.5 rounded-full inline-block ${isUserOnline(selectedUser.email)
//                 ? "bg-green-500"
//                 : "bg-gray-400"
//               }`}
//           />

//           {isUserOnline(selectedUser.email)
//             ? "Active"
//             : "Offline"}
//         </p>
//       </div>
//     </div>
//   ) : null;



//   return (
//     <div className="flex h-[calc(105vh-100px)] bg-background rounded-xl border border-border overflow-hidden">

//       {/* CONTACTS */}

//       <div className="w-72  flex-shrink-0 border-r border-border flex flex-col bg-card">

//         <div className="px-4 py-3.5 border-b border-border">
//           <h2 className="text-sm font-bold">
//             Messages
//           </h2>

//           <p className="text-xs text-muted-foreground mt-0.5">
//             {contacts.length} contact
//             {contacts.length !== 1 ? 's' : ''}
//           </p>
//         </div>

//         <div className="px-3 py-2 border-b border-border">

//           <div className="relative">

//             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />

//             <Input
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               placeholder="Search contacts..."
//               className="pl-8 h-8 text-xs bg-muted border-0"
//             />

//           </div>

//         </div>

//         <div className="flex-1 overflow-y-auto py-1">

//           {filteredContacts.length === 0 ? (

//             <div className="flex flex-col items-center justify-center h-32 text-muted-foreground px-4 text-center">

//               <Users className="w-8 h-8 opacity-20 mb-2" />

//               <p className="text-xs">
//                 No contacts yet
//               </p>

//             </div>

//           ) : (

//             filteredContacts.map(contact => {

//               const isActive =
//                 selectedUser?.email === contact.email;

//               return (
//                 <button
//                   key={contact.email}
//                   onClick={() => setSelectedUser(contact)}
//                   className={`w-full flex items-center gap-3 px-3 py-3 transition-colors text-left hover:bg-muted/40 border-b border-border/40
//                   ${isActive
//                       ? 'bg-primary/10 border-l-2 border-l-primary'
//                       : ''
//                     }`}
//                 >

//                   <Avatar
//                     name={contact.name}
//                     email={contact.email}
//                     size={9}
//                   />

//                   <div className="flex-1 min-w-0">

//                     <p className="text-sm font-semibold truncate">
//                       {contact.name}
//                     </p>

//                     <p className="text-[11px] text-muted-foreground truncate">
//                       {contact.email}
//                     </p>

//                   </div>

//                 </button>
//               );
//             })

//           )}

//         </div>

//       </div>

//       {/* CHAT */}

//       <div className="flex-1 overflow-hidden">

//         {!selectedUser ? (

//           <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground gap-3">

//             <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
//               <MessageSquare className="w-7 h-7 opacity-30" />
//             </div>

//             <p className="text-sm font-medium">
//               Select a contact
//             </p>

//             <p className="text-xs text-muted-foreground">
//               Choose someone to start a conversation
//             </p>

//           </div>

//         ) : (

//           <ChatBox
//             key={roomId}
//             roomId={roomId}
//             currentUser={currentUser}
//             headerContent={headerContent}
//             onBack={() => setSelectedUser(null)}
//           />

//         )}

//       </div>

//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { MessageSquare, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ChatBox, { Avatar } from '@/components/chat/ChatBox';
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  auth: {
    token: localStorage.getItem("token"),
  },
});

function dmRoomId(emailA, emailB) {
  return 'dm_' + [emailA, emailB].sort().join('__');
}

export default function PersonalChat({ currentUser, companies }) {

  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  const isUserOnline = email => onlineUsers.includes(email);

  // SOCKET
  useEffect(() => {
    if (currentUser?.email) {
      socket.emit("user-online", currentUser.email);
    }

    socket.on("online-users", setOnlineUsers);

    return () => socket.off("online-users");
  }, [currentUser]);

  // CONTACTS
  const { data: contacts = [] } = useQuery({
    queryKey: ['personal-chat-contacts', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];

      const map = new Map();
      const myCompanies = companies || [];

      const investorResults = await Promise.all(
        myCompanies.map(c =>
          api.entities.Investor.filter({ company_id: c.id })
        )
      );

      investorResults.flat().forEach(inv => {
        const email = inv.user_email || inv.email;
        if (email && email !== currentUser.email) {
          map.set(email, {
            email,
            name: inv.name || email,
          });
        }
      });

      const allCompanies = await api.entities.Company.list();

      const relatedCompanies = await Promise.all(
        allCompanies.map(async company => {
          const investors = await api.entities.Investor.filter({
            company_id: company.id,
          });

          const exists = investors.find(inv => {
            const email = inv.user_email || inv.email;
            return email === currentUser.email;
          });

          return exists ? company : null;
        })
      );

      relatedCompanies.filter(Boolean).forEach(company => {
        const ownerEmail =
          company.created_by ||
          company.user_email ||
          company.email;

        if (ownerEmail && ownerEmail !== currentUser.email) {
          map.set(ownerEmail, {
            email: ownerEmail,
            name: company.name || ownerEmail,
          });
        }
      });

      return Array.from(map.values());
    },
    enabled: true,
  });

  const filteredContacts = search
    ? contacts.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    )
    : contacts;

  const roomId = selectedUser
    ? dmRoomId(currentUser?.email, selectedUser.email)
    : null;

  const headerContent = selectedUser ? (
    <div className="flex items-center gap-3">
      <Avatar name={selectedUser.name} email={selectedUser.email} size={9} />

      <div>
        <p className="text-sm font-semibold">{selectedUser.name}</p>
        <p className={`text-[10px] flex items-center gap-1 ${
          isUserOnline(selectedUser.email) ? "text-green-500" : "text-gray-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isUserOnline(selectedUser.email) ? "bg-green-500" : "bg-gray-400"
          }`} />
          {isUserOnline(selectedUser.email) ? "Active" : "Offline"}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div className="
      flex flex-col md:flex-row
      h-[100vh] md:h-[calc(105vh-100px)]
      bg-background rounded-xl border border-border overflow-hidden
    ">

      {/* CONTACTS */}
      <div className={`
        w-full md:w-72
        flex-shrink-0 border-b md:border-b-0 md:border-r border-border
        flex flex-col bg-card
        ${selectedUser ? "hidden md:flex" : "flex"}
      `}>

        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-bold">Messages</h2>
          <p className="text-xs text-muted-foreground">
            {contacts.length} contacts
          </p>
        </div>

        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-xs bg-muted border-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-center">
              <Users className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">No contacts</p>
            </div>
          ) : (
            filteredContacts.map(contact => {
              const active = selectedUser?.email === contact.email;

              return (
                <button
                  key={contact.email}
                  onClick={() => setSelectedUser(contact)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 text-left
                    hover:bg-muted/40 border-b border-border/40
                    ${active ? "bg-primary/10 md:border-l-2 md:border-l-primary" : ""}
                  `}
                >
                  <Avatar name={contact.name} email={contact.email} size={9} />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {contact.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {contact.email}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT */}
      <div className={`
        flex-1 overflow-hidden
        ${!selectedUser ? "hidden md:flex" : "flex flex-col"}
      `}>

        {!selectedUser ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground flex-col gap-2">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">Select a contact</p>
          </div>
        ) : (
          <ChatBox
            key={roomId}
            roomId={roomId}
            currentUser={currentUser}
            headerContent={headerContent}
            onBack={() => setSelectedUser(null)}
          />
        )}

      </div>

    </div>
  );
}