import { useEffect, useRef, useState } from "react";
import api from "../api/client";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I’m Meridian Assistant. Ask me anything about bank procedures, policies, or troubleshooting.",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages, isOpen, loading]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const question = input.trim();

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: question,
      },
    ]);

    setLoading(true);

    try {
      const { data } = await api.post("/chatbot/ask", {
        question,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, something went wrong while processing your question. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="
            group relative
            flex items-center gap-3
            px-4 py-3
            rounded-2xl
            bg-[#282A22]
            text-[#F7F4EE]
            border border-[#B99551]/30
            shadow-[0_16px_45px_rgba(40,42,34,0.18)]
            transition-all duration-300
            hover:-translate-y-1
            hover:shadow-[0_20px_50px_rgba(40,42,34,0.24)]
          "
        >
          <span className="absolute inset-0 rounded-2xl bg-[#C7A45D]/10 opacity-0 group-hover:opacity-100 transition-opacity" />

          <span
            className="
              relative
              w-9 h-9
              rounded-xl
              bg-[#3A3C32]
              border border-white/10
              flex items-center justify-center
            "
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D4AE61"
              strokeWidth="1.6"
            >
              <path d="M12 3a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h1v-5H5" />
              <path d="M12 3a8 8 0 0 1 8 8v3a2 2 0 0 1-2 2h-1v-5h2" />
              <path d="M9 20h6" />
              <path d="M12 18v2" />
            </svg>

            <span
              className="
                absolute -right-0.5 -top-0.5
                w-2.5 h-2.5
                rounded-full
                bg-[#86A17A]
                border-2 border-[#282A22]
              "
            />
          </span>

          <span className="relative text-left">
            <span
              className="
                block
                text-[10px]
                font-mono
                uppercase
                tracking-[0.15em]
                text-[#D4AE61]
              "
            >
              AI Assistant
            </span>

            <span className="block text-sm font-medium mt-0.5">
              Need some help?
            </span>
          </span>

          <span
            className="
              relative ml-1
              text-[#CDA85E]
              text-lg
              transition-transform
              duration-300
              group-hover:translate-x-0.5
            "
          >
            →
          </span>
        </button>
      ) : (
        <div
          className="
            w-[calc(100vw-32px)]
            sm:w-[410px]
            h-[min(650px,calc(100vh-32px))]
            flex flex-col
            overflow-hidden
            rounded-[26px]
            bg-[#FBF9F5]
            border border-[#DED8CC]
            shadow-[0_25px_80px_rgba(40,38,30,0.20)]
            animate-scale-in
          "
        >
          {/* HEADER */}
          <div
            className="
              relative
              shrink-0
              overflow-hidden
              bg-[#282A22]
              text-[#F7F4EE]
              px-5 py-4
            "
          >
            <div
              className="
                absolute
                -right-12
                -top-16
                w-40 h-40
                rounded-full
                border
                border-[#D4AE61]/10
              "
            />

            <div
              className="
                absolute
                -right-4
                -top-8
                w-24 h-24
                rounded-full
                border
                border-[#D4AE61]/10
              "
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-10 h-10
                    rounded-xl
                    bg-[#3A3C32]
                    border border-white/10
                    flex items-center justify-center
                  "
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D4AE61"
                    strokeWidth="1.5"
                  >
                    <path d="M12 3a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h1v-5H5" />
                    <path d="M12 3a8 8 0 0 1 8 8v3a2 2 0 0 1-2 2h-1v-5h2" />
                    <path d="M9 20h6" />
                    <path d="M12 18v2" />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-[17px]">
                      Meridian Assistant
                    </p>

                    <span
                      className="
                        w-1.5 h-1.5
                        rounded-full
                        bg-[#86A17A]
                        shadow-[0_0_8px_rgba(134,161,122,0.7)]
                      "
                    />
                  </div>

                  <p
                    className="
                      text-[9px]
                      font-mono
                      uppercase
                      tracking-[0.16em]
                      text-[#BEBBB0]
                      mt-0.5
                    "
                  >
                    Knowledge Assistant
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="
                  w-8 h-8
                  rounded-lg
                  bg-white/5
                  border border-white/10
                  text-[#BEBBB0]
                  flex items-center justify-center
                  hover:bg-white/10
                  hover:text-white
                  transition
                "
              >
                ×
              </button>
            </div>

            <div
              className="
                relative
                mt-4
                pt-3
                border-t border-white/10
                flex items-center justify-between
              "
            >
              <span className="text-[10px] text-[#999A91]">
                Ask about procedures & policies
              </span>

              <span
                className="
                  text-[9px]
                  font-mono
                  uppercase
                  tracking-wider
                  text-[#CDA85E]
                "
              >
                RAG ACTIVE
              </span>
            </div>
          </div>

          {/* MESSAGES */}
          <div
            className="
              flex-1
              overflow-y-auto
              px-4 py-5
              space-y-5
              bg-[#F7F4EE]
            "
          >
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";

              return (
                <div
                  key={index}
                  className={`flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div
                      className="
                        shrink-0
                        w-7 h-7
                        rounded-lg
                        bg-[#282A22]
                        text-[#D4AE61]
                        flex items-center justify-center
                        mr-2
                        mt-1
                      "
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M12 3a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h1v-5H5" />
                        <path d="M12 3a8 8 0 0 1 8 8v3a2 2 0 0 1-2 2h-1v-5h2" />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] ${
                      isUser ? "" : "mr-5"
                    }`}
                  >
                    <div
                      className={
                        isUser
                          ? `
                            px-4 py-3
                            rounded-[18px]
                            rounded-br-md
                            bg-[#282A22]
                            text-[#F7F4EE]
                            shadow-[0_6px_18px_rgba(40,42,34,0.10)]
                            text-[13px]
                            leading-[1.65]
                          `
                          : `
                            px-4 py-3
                            rounded-[18px]
                            rounded-bl-md
                            bg-white
                            text-[#41433C]
                            border border-[#E4DED4]
                            shadow-[0_5px_18px_rgba(45,40,30,0.04)]
                            text-[13px]
                            leading-[1.65]
                          `
                      }
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {!isUser &&
                      msg.sources &&
                      msg.sources.length > 0 && (
                        <div
                          className="
                            mt-2.5
                            rounded-xl
                            border border-[#E4DED4]
                            bg-[#FBF9F5]
                            px-3 py-2.5
                          "
                        >
                          <div
                            className="
                              flex items-center gap-1.5
                              mb-1.5
                            "
                          >
                            <span
                              className="
                                text-[9px]
                                font-mono
                                uppercase
                                tracking-wider
                                text-[#A47D32]
                              "
                            >
                              Sources
                            </span>
                          </div>

                          <p
                            className="
                              text-[10px]
                              leading-4
                              text-[#7F8079]
                            "
                          >
                            {msg.sources
                              .map(
                                (source) =>
                                  source.section || source.doc
                              )
                              .join(" · ")}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}

            {/* LOADING */}
            {loading && (
              <div className="flex items-start">
                <div
                  className="
                    shrink-0
                    w-7 h-7
                    rounded-lg
                    bg-[#282A22]
                    text-[#D4AE61]
                    flex items-center justify-center
                    mr-2
                  "
                >
                  ✦
                </div>

                <div
                  className="
                    px-4 py-3
                    rounded-[18px]
                    rounded-bl-md
                    bg-white
                    border border-[#E4DED4]
                    flex items-center gap-1.5
                  "
                >
                  <span
                    className="
                      w-1.5 h-1.5
                      rounded-full
                      bg-[#B99551]
                      animate-bounce
                    "
                  />

                  <span
                    className="
                      w-1.5 h-1.5
                      rounded-full
                      bg-[#B99551]
                      animate-bounce
                    "
                    style={{ animationDelay: "120ms" }}
                  />

                  <span
                    className="
                      w-1.5 h-1.5
                      rounded-full
                      bg-[#B99551]
                      animate-bounce
                    "
                    style={{ animationDelay: "240ms" }}
                  />

                  <span
                    className="
                      ml-2
                      text-[10px]
                      text-[#999A92]
                    "
                  >
                    Searching knowledge...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleSubmit}
            className="
              shrink-0
              p-3
              bg-white
              border-t border-[#E4DED4]
            "
          >
            <div
              className="
                flex items-center gap-2
                rounded-2xl
                bg-[#F7F4EE]
                border border-[#DED8CC]
                p-1.5
                focus-within:border-[#B99551]
                focus-within:ring-4
                focus-within:ring-[#C7A45D]/10
                transition-all
              "
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask a banking question..."
                className="
                  flex-1
                  min-w-0
                  bg-transparent
                  px-3
                  py-2.5
                  text-[13px]
                  text-[#34362F]
                  outline-none
                  placeholder:text-[#A5A49D]
                "
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="
                  shrink-0
                  w-10 h-10
                  rounded-xl
                  bg-[#282A22]
                  text-[#D4AE61]
                  flex items-center justify-center
                  transition-all
                  hover:bg-[#383A31]
                  disabled:opacity-30
                "
              >
                {loading ? (
                  <span
                    className="
                      w-4 h-4
                      rounded-full
                      border-2
                      border-[#D4AE61]/30
                      border-t-[#D4AE61]
                      animate-spin
                    "
                  />
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M22 2 11 13" />
                    <path d="m22 2-7 20-4-9-9-4Z" />
                  </svg>
                )}
              </button>
            </div>

            <div
              className="
                flex items-center
                justify-center
                gap-1.5
                mt-2
              "
            >
              <span className="text-[9px] text-[#A1A19A]">
                Meridian AI Assistant
              </span>

              <span
                className="
                  w-0.5 h-0.5
                  rounded-full
                  bg-[#C2BFB7]
                "
              />

              <span className="text-[9px] text-[#A1A19A]">
                Secure knowledge base
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}