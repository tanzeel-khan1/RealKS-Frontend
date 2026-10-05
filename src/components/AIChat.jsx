import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/api/apiClient";
import {
  AlertCircle,
  ArrowUp,
  Bot,
  Brain,
  ChevronDown,
  Code2,
  Compass,
  Copy,
  Globe,
  History,
  Library,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Wand2,
} from "lucide-react";

const quickPrompts = [
  "Summarize my idea in simple words",
  "Give me a business plan outline",
  "Write this in a professional tone",
  "Give me 5 ways to increase sales",
];

const featureChips = [
  { label: "Summary", icon: Brain },
  { label: "Code", icon: Code2 },
  { label: "Design", icon: Wand2 },
  { label: "Research", icon: Globe },
];

const defaultHistory = {
  Today: [
    "What's something you've learned lately?",
    "Best travel experience",
    "Favorite book",
  ],
  Yesterday: ["If you could teleport anywhere..."],
  "7 Days Ago": ["How do I stay productive every day?"],
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const AIChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const bottomRef = useRef(null);
  const displayName = "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAskAI = async (customMessage) => {
    const cleanMessage = (customMessage || message).trim();

    if (!cleanMessage) {
      setError("Please enter a message");
      return;
    }

    const userMessage = {
      role: "user",
      content: cleanMessage,
    };

    try {
      setLoading(true);
      setError("");
      setMessage("");
      setMessages((prev) => [...prev, userMessage]);

      const data = await api.ai.ask(cleanMessage);

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
          },
        ]);
      } else {
        setError(data.message || "AI failed to reply");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  const copyReply = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setMessage("");
    setError("");
  };

  const sidebarHistory = useMemo(() => {
    if (!search.trim()) return defaultHistory;

    const filtered = {};

    Object.entries(defaultHistory).forEach(([section, items]) => {
      const matches = items.filter((item) =>
        item.toLowerCase().includes(search.toLowerCase())
      );

      if (matches.length) {
        filtered[section] = matches;
      }
    });

    return filtered;
  }, [search]);

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="mx-auto flex h-[calc(100vh-16px)] max-w-[1600px] overflow-hidden rounded-[22px]">

        {/* Sidebar */}
        <aside
          className="
            hidden md:flex
            w-[300px] lg:w-[320px]
            flex-col
            border-r
            shrink-0
          "
        >

          {/* Search */}
          <div className="p-4 lg:p-5">
            <div className="flex h-12 lg:h-14 items-center rounded-2xl border px-4">

              <Search className="h-5 w-5 shrink-0" />

              <input
                type="text"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                placeholder="Search chats..."
                className="
                  ml-3
                  w-full
                  bg-transparent
                  text-sm
                  lg:text-[16px]
                  text-[#333]
                  outline-none
                  placeholder:text-[#8a8a8a]
                "
              />

            </div>
          </div>


          {/* History */}
          <div className="
              flex-1
              overflow-y-auto
              px-4
              lg:px-5
              scrollbar-thin
          ">

            {Object.entries(sidebarHistory).map(([section,items])=>(
              
              <div key={section} className="mb-6 lg:mb-8">

                <h3 className="
                    mb-3
                    text-sm
                    lg:text-[15px]
                    font-medium
                ">
                  {section}
                </h3>


                <div className="space-y-1.5">

                {items.map((item)=>(

                  <button
                    key={item}
                    type="button"
                    onClick={()=>setMessage(item)}

                    className="
                      block
                      w-full
                      rounded-xl
                      px-3
                      lg:px-4
                      py-2.5
                      lg:py-3
                      text-left
                      text-sm
                      lg:text-[16px]
                      transition
                      hover:bg-white
                    "
                  >

                    <span className="line-clamp-1">
                      {item}
                    </span>

                  </button>

                ))}

                </div>


              </div>

            ))}

          </div>



          {/* Bottom Menu */}

          <div className="border-t px-4 lg:px-5 py-4">

            <div className="space-y-1">


              {[
                {label:"Explore",icon:Compass},
                {label:"Library",icon:Library},
                {label:"History",icon:History},
                {label:"Upgrade",icon:Sparkles},
              ].map(({label,icon:Icon})=>(

                <button
                  key={label}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    lg:px-4
                    py-2.5
                    lg:py-3
                    text-left
                    text-sm
                    lg:text-[16px]
                    transition
                  "
                >

                  <Icon className="h-5 w-5"/>

                  <span>
                    {label}
                  </span>

                </button>

              ))}


            </div>



            <button

              type="button"

              onClick={clearChat}

              className="
                mt-4
                lg:mt-5
                flex
                h-11
                lg:h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-black
                text-white
                text-sm
                lg:text-[18px]
                font-medium
                transition
                hover:bg-[#1f1f1f]
              "

            >

              <Plus className="h-5 w-5"/>

              New Chat

            </button>


          </div>


        </aside>



        {/* Main Content */}
        <main className="
          flex-1
          min-w-0
          flex
          flex-col
        "> 
          {messages.length === 0 ? (

<div className="flex flex-1 flex-col">


  {/* Center Hero */}

  <div
    className="
      flex
      flex-1
      flex-col
      items-center
      justify-center
      px-4
      text-center
      overflow-hidden
    "
  >


    <div
      className="
        relative
        mb-8
        sm:mb-12
        h-24
        w-24
        sm:h-32
        sm:w-32
        md:h-36
        md:w-36
        rounded-full
        bg-gradient-to-br
        from-[#ceb3fb]
        via-[#efcfd7]
        to-[#f4b079]
        opacity-80
      "
    >


      <div
        className="
          absolute
          inset-4
          sm:inset-5
          rounded-full
          bg-gradient-to-br
          from-[#f4e9ff]
          via-[#f4d6d0]
          to-[#f5b37d]
          opacity-70
          blur-md
        "
      />


      <div
        className="
          absolute
          inset-[30%]
          rounded-full
          bg-[radial-gradient(circle,_rgba(189,108,168,0.35)_0%,_rgba(244,169,111,0.4)_45%,_transparent_75%)]
        "
      />


    </div>



    <h1
      className="
        text-[32px]
        sm:text-[42px]
        md:text-[56px]
        font-medium
        leading-tight
      "
    >
      {getGreeting()}
    </h1>



    <h2
      className="
        mt-2
        text-[28px]
        sm:text-[38px]
        md:text-[56px]
        font-medium
        leading-tight
      "
    >

      How Can I{" "}

      <span
        className="
          bg-gradient-to-r
          from-[#ba7af7]
          to-[#99a9ff]
          bg-clip-text
          text-transparent
        "
      >
        Assist You Today?
      </span>

    </h2>


  </div>




  {/* Input Area */}

  <div className="px-3 sm:px-4 pb-4 sm:pb-6">

    <div className="mx-auto w-full max-w-5xl">


      <div
        className="
          rounded-[22px]
          p-2
          sm:p-3
          shadow-[inset_0_-4px_0_rgba(0,0,0,0.05)]
        "
      >


        <div
          className="
            px-2
            sm:px-3
            pb-3
            text-xs
            sm:text-sm
          "
        >

          Use our faster AI on Pro Plan

          <span className="mx-2">
            •
          </span>


          <button className="font-medium">
            Upgrade
          </button>


        </div>




        <div
          className="
            rounded-[22px]
            border
            p-3
            sm:p-4
          "
        >


          {error && (

            <div
              className="
                mb-3
                flex
                items-start
                gap-2
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-3
                py-2
                text-sm
                text-red-600
              "
            >

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>

              <span>
                {error}
              </span>


            </div>

          )}




          <textarea

            value={message}

            onChange={(e)=>setMessage(e.target.value)}

            onKeyDown={handleKeyDown}

            placeholder="Ask me anything..."

            disabled={loading}

            rows={3}

            className="
              w-full
              resize-none
              border-0
              bg-transparent
              text-[16px]
              sm:text-[18px]
              outline-none
              placeholder:text-[#8f8f8f]
            "

          />




          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            "
          >



            <div className="flex items-center gap-2">


              <button

                type="button"

                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  transition
                  hover:bg-[#f4f4f4]
                "

              >

                <Paperclip className="h-5 w-5"/>

              </button>





              <button

                type="button"

                className="
                  hidden
                  sm:flex
                  h-10
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-[#d8d8d8]
                  bg-[#fbfbfb]
                  px-4
                  text-[15px]
                  text-[#2d2d2d]
                "

              >

                <Globe className="h-4 w-4"/>

                Claude 3.5 sonnet

                <ChevronDown className="h-4 w-4 text-[#8a8a8a]"/>

              </button>



            </div>





            <div className="flex items-center gap-2">


              <button

                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-[#dbdbdb]
                  bg-[#fafafa]
                "

              >

                <Mic className="h-5 w-5"/>

              </button>




              <button

                onClick={()=>handleAskAI()}

                disabled={loading || !message.trim()}

                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#7f7f7f]
                  text-white
                  transition
                  hover:bg-[#666]
                  disabled:opacity-60
                "

              >

                {
                  loading
                  ?
                  <Loader2 className="h-5 w-5 animate-spin"/>
                  :
                  <ArrowUp className="h-5 w-5"/>
                }


              </button>


            </div>



          </div>



        </div>



      </div>




      <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">


        {featureChips.map(({label,icon:Icon})=>(

          <button

            key={label}

            onClick={()=>setMessage(label)}

            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-[#d7d7d7]
              bg-[#f8f8f8]
              px-3
              sm:px-4
              py-2
              text-sm
              sm:text-[16px]
              text-[#2c2c2c]
            "

          >

            <Icon className="h-4 w-4"/>

            {label}

          </button>


        ))}


      </div>



    </div>


  </div>


</div>

) : (
            <>
              <div className="
  flex-1
  overflow-y-auto
  px-3
  py-5
  sm:px-6
  md:px-8
">

  <div className="
    mx-auto
    flex
    max-w-4xl
    flex-col
    gap-4
    sm:gap-5
  ">


    {messages.map((item,index)=>{

      const isUser = item.role === "user";


      return (

        <div

          key={index}

          className={`
            flex
            items-start
            gap-2
            sm:gap-3

            ${isUser
              ? "justify-end"
              : "justify-start"
            }
          `}

        >


          {!isUser && (

            <div
              className="
                flex
                h-9
                w-9
                sm:h-10
                sm:w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-black
                text-white
              "
            >

              <Bot className="h-4 w-4"/>

            </div>

          )}





          <div

            className={`
              group
              relative
              max-w-[85%]
              sm:max-w-[75%]

              rounded-[20px]
              px-3
              sm:px-4

              py-2.5
              sm:py-3

              text-sm
              sm:text-[15px]

              leading-6
              sm:leading-7

              shadow-sm

              ${
                isUser

                ?

                "rounded-tr-md bg-black text-white"

                :

                "rounded-tl-md border border-[#dedede] text-[#222]"

              }

            `}

          >


            <p className="
              whitespace-pre-wrap
              break-words
            ">

              {item.content}

            </p>



            {!isUser && (

              <button

                type="button"

                onClick={()=>copyReply(item.content)}

                className="
                  absolute
                  -right-2
                  -top-2

                  hidden
                  rounded-full
                  border
                  border-[#dcdcdc]

                  bg-white

                  p-1.5

                  text-[#666]

                  shadow-sm

                  group-hover:block

                "

              >

                <Copy className="h-3.5 w-3.5"/>

              </button>


            )}



          </div>





          {isUser && (

            <div

              className="
                flex
                h-9
                w-9
                sm:h-10
                sm:w-10

                shrink-0

                items-center
                justify-center

                rounded-full

                bg-[#e7e7e7]

                text-[#444]
              "

            >

              <UserRound className="h-4 w-4"/>


            </div>


          )}





        </div>


      );


    })}





    {loading && (

      <div className="flex items-start gap-2 sm:gap-3">


        <div
          className="
            flex
            h-9
            w-9
            sm:h-10
            sm:w-10

            shrink-0

            items-center
            justify-center

            rounded-full

            bg-black

            text-white
          "
        >

          <Bot className="h-4 w-4"/>


        </div>



        <div
          className="
            rounded-[20px]
            rounded-tl-md

            border
            border-[#dedede]

            px-3
            sm:px-4

            py-2.5

            text-sm
            sm:text-[15px]

            text-[#555]

            shadow-sm
          "
        >

          <div className="flex items-center gap-2">

            <Loader2 className="h-4 w-4 animate-spin"/>

            AI is thinking...

          </div>


        </div>



      </div>


    )}



    <div ref={bottomRef}/>


  </div>


</div>

              <div className="
  border-t
  border-[#dfdfdf]

  px-3
  py-4

  sm:px-6
  sm:py-5
">


<div className="mx-auto w-full max-w-4xl">


<div
className="
rounded-[22px]
bg-[#d6d6d6]

p-2
sm:p-3

shadow-[inset_0_-4px_0_rgba(0,0,0,0.05)]
"
>


<div className="
px-2
pb-3
text-xs
sm:text-sm
text-[#444]
">

Continue your conversation

</div>



<div
className="
rounded-[22px]
border
border-[#dddddd]

p-3
sm:p-4
"
>


<textarea

value={message}

onChange={(e)=>setMessage(e.target.value)}

onKeyDown={handleKeyDown}

placeholder="Ask me anything..."

disabled={loading}

rows={3}

className="
w-full
resize-none
border-0
bg-transparent

text-[16px]

outline-none

placeholder:text-[#8f8f8f]
"

/>



<div className="
mt-3

flex
flex-wrap

items-center
justify-between

gap-3
">



<div className="flex items-center gap-2">


<button
className="
flex
h-10
w-10

items-center
justify-center

rounded-full

transition

hover:bg-[#f4f4f4]
"
>

<Paperclip className="h-5 w-5"/>

</button>



<button

className="
hidden
sm:flex

h-10

items-center

gap-2

rounded-full

border

border-[#d8d8d8]

bg-[#fbfbfb]

px-4

text-[15px]

"

>

<Globe className="h-4 w-4"/>

Claude 3.5 sonnet

<ChevronDown className="h-4 w-4"/>


</button>



</div>




<div className="flex items-center gap-2">


<button
className="
flex
h-10
w-10

items-center
justify-center

rounded-full

border

border-[#dbdbdb]

bg-[#fafafa]
"
>

<Mic className="h-5 w-5"/>

</button>




<button

onClick={()=>handleAskAI()}

disabled={loading || !message.trim()}

className="
flex
h-10
w-10

items-center
justify-center

rounded-full

bg-[#7f7f7f]

text-white

disabled:opacity-60
"

>

{
loading
?
<Loader2 className="h-5 w-5 animate-spin"/>
:
<ArrowUp className="h-5 w-5"/>
}


</button>



</div>



</div>


</div>


</div>


</div>


</div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AIChat;