import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, HelpCircle, ChevronDown, ChevronUp, MessageSquare, Sparkles, X, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface EcoChatbotProps {}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What items are actually compostable?",
    answer: "Generally, anything that was once alive can be composted! This includes fruit and vegetable scraps, coffee grounds and filters, tea bags (ensure they are plastic-free), eggshells, nut shells, shredded cardboard, paper bags, yard waste (leaves, grass), and untreated wood chips. Avoid adding meat, dairy, fats, pet waste, or diseased plants to home compost piles, as they attract pests and create odor."
  },
  {
    question: "Why can't plastic bags go in curbside recycling bins?",
    answer: "Thin-film plastics (like shopping bags, bubble wrap, and ziplock bags) clog and wrap around the heavy sorting machinery at Material Recovery Facilities (MRFs), causing dangerous shutdowns and equipment damage. These thin plastics should instead be clean, dry, and dropped off at designated retail collection bins found in most grocery stores."
  },
  {
    question: "How should I dispose of old batteries and electronics?",
    answer: "Batteries and electronics (e-waste) contain toxic heavy metals like lead, cadmium, and lithium that can contaminate soil and water or cause fires in landfills. They must never go in standard bins. You should take them to your local hazardous waste depot, municipal drop-off sites, or participating retail take-back programs (like Best Buy or hardware stores)."
  },
  {
    question: "Is it better to use paper, plastic, or reusable shopping bags?",
    answer: "The best bag is the one you already own! While plastic bags are terrible for marine life, manufacturing paper bags uses more water and energy. Standard reusable cotton bags require thousands of uses to offset their carbon footprint. The ultimate ecological rule: reuse whatever bag you have as many times as possible to minimize its lifecycle impact."
  },
  {
    question: "What do the recycling numbers (1–7) on plastics mean?",
    answer: "The numbers are 'Resin Identification Codes' indicating the type of plastic. They don't guarantee local recyclability! \n- #1 (PET) & #2 (HDPE) are almost universally recycled (bottles, milk jugs).\n- #5 (PP) is widely accepted (yogurt tubs).\n- #3 (PVC), #4 (LDPE), #6 (PS/Styrofoam), and #7 (Other) are rarely accepted in standard curbside programs. Always check your local municipality's guidelines!"
  }
];

const SUGGESTED_PROMPTS = [
  "How can I start composting in a small apartment?",
  "Which plastics can I safely recycle curbside?",
  "How do I reduce household food waste?",
  "What are easy ways to lower my home carbon footprint?"
];

export const EcoChatbot: React.FC<EcoChatbotProps> = () => {
  const [activeTab, setActiveTab] = useState<"chat" | "faq">("chat");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: "Hello! I am **EarthIQ AI**, your personal sustainability coach. 🌿 Ask me anything about waste sorting, recycling, composting, reducing your carbon footprint, or eco-friendly living! How can I help you support our planet today?",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [preloadedAnswers, setPreloadedAnswers] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchPreloaded = async () => {
      try {
        const response = await fetch("/api/chat/preload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompts: SUGGESTED_PROMPTS })
        });
        const data = await response.json();
        setPreloadedAnswers(data.answers || {});
      } catch (e) {
        console.error("Failed to preload answers", e);
      }
    };
    fetchPreloaded();
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    if (!textToSend) {
      setInputMessage("");
    }

    // Check preloaded first
    if (preloadedAnswers[text]) {
        const userMsg: Message = {
            id: Math.random().toString(),
            role: "user",
            content: text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg, {
            id: Math.random().toString(),
            role: "model",
            content: preloadedAnswers[text],
            timestamp: Date.now()
        }]);
        return;
    }

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach your EarthIQ coach. Please try again.");
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          content: data.text || "I was unable to process that. Let's try another green topic!",
          timestamp: Date.now()
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "model",
          content: `⚠️ **Error:** ${err.message || "An unexpected issue occurred. Please check your connection."}`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaqClick = (question: string) => {
    setActiveTab("chat");
    handleSendMessage(question);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col overflow-hidden bg-slate-900/40 backdrop-blur-sm md:border md:border-slate-800/50 md:rounded-xl">
      {/* Tabs */}
      <div className="px-4 py-2 bg-slate-950/20 border-b border-slate-800/50 flex gap-2">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "chat"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/15"
              : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI Coach
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === "faq"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/15"
              : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Sustainability FAQ
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
        <AnimatePresence mode="wait">
          {activeTab === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 min-h-full flex flex-col justify-between"
            >
              <div className="space-y-4 flex-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[90%] md:max-w-[85%] ${
                      msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border text-[10px] font-bold mt-1 ${
                        msg.role === "user"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl border text-left overflow-hidden ${
                        msg.role === "user"
                          ? "bg-emerald-500/10 border-emerald-500/20 rounded-tr-none text-emerald-100"
                          : "bg-slate-900 border-slate-800/90 rounded-tl-none text-slate-200"
                      }`}
                    >
                      <div className="prose prose-invert max-w-none text-slate-200 text-xs">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ node, ...props }) => (
                              <p className="text-xs text-slate-200 leading-relaxed mb-2.5 last:mb-0" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                              <li className="text-xs text-slate-200 leading-relaxed mb-1.5 flex items-start gap-2">
                                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                                <span className="flex-1" {...props} />
                              </li>
                            ),
                            ul: ({ node, ...props }) => <ul className="space-y-1 my-2.5" {...props} />,
                            ol: ({ node, ...props }) => <ol className="space-y-1.5 my-2.5 list-decimal pl-5 text-xs text-slate-200" {...props} />,
                            h1: ({ node, ...props }) => <h1 className="text-sm font-black text-emerald-400 uppercase tracking-tight my-2.5 border-b border-emerald-500/20 pb-1" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xs font-black text-emerald-300 uppercase tracking-tight my-2 border-b border-white/5 pb-1" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-white uppercase tracking-tight my-1.5" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-emerald-300" {...props} />,
                            code: ({ node, ...props }) => <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[11px] text-emerald-300 font-mono" {...props} />
                          }}
                        >
                          {typeof msg.content === 'string' ? msg.content : String(msg.content)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-300">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl border bg-slate-900 border-slate-800/80 rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                      <span className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest animate-pulse">EarthIQ thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Prompts if few messages */}
              {messages.length <= 2 && !isLoading && (
                <div className="mt-4 pt-3 border-t border-slate-800/50">
                  <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Lightbulb className="w-3 h-3 text-amber-400" /> Suggested Green Topics:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((promptText, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(promptText)}
                        className="text-[11px] text-slate-300 bg-slate-900/90 hover:bg-emerald-500/10 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/30 px-3 py-1.5 rounded-xl text-left transition-all"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="faq"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="text-center py-2 mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Frequently Asked Questions</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Tap a question to read the answer or ask our AI Coach!</p>
              </div>

              {FAQ_ITEMS.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-200 pr-4">{faq.question}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-slate-950/20 border-t border-slate-800/40 text-left">
                        <p className="text-xs text-slate-300 leading-relaxed mb-4 whitespace-pre-line">{faq.answer}</p>
                        <button
                          onClick={() => handleFaqClick(faq.question)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all"
                        >
                          <Sparkles className="w-3 h-3" /> Ask AI about this
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Tray */}
      {activeTab === "chat" && (
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your eco-question..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all disabled:opacity-40 shrink-0 shadow-lg shadow-emerald-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
