import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react'; // Hoặc 'framer-motion' tùy bạn đang cài thư viện nào
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';
import { aiApi } from '../../api/ai.api'; // Thay đổi đường dẫn này nếu file ai.api.ts nằm ở vị trí khác

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  events?: any[];
}

export const AiChatbotAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của UTEHY Social. Tôi có thể giúp gợi ý sự kiện phù hợp với bạn. Hãy thử hỏi: "Trường mình sắp tới có sự kiện gì không?"',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const currentInput = inputValue;

    // 1. Thêm tin nhắn của user vào giao diện
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 2. Gọi API thật từ ai.api.ts
      const response: any = await aiApi.chat(currentInput);

      // 3. Xử lý dữ liệu trả về (Linh hoạt lấy data tùy thuộc format của Axios/Backend)
      const replyText = response.data?.data?.reply || response.data?.reply || response.reply || 'Xin lỗi, tôi không nhận được thông tin phản hồi rõ ràng.';

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Lỗi khi chat với AI:', error);
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, máy chủ AI đang tải dữ liệu hoặc mạng đang gián đoạn. Bạn thử lại sau vài giây nhé!',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Desktop View - Sidebar Card */}
      <div className="hidden lg:flex flex-col h-[450px] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-400">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Assistant 24/7
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.isUser ? 'order-2' : ''}`}>
                <div
                  className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    message.isUser
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-xl rounded-bl-md text-sm">
                <div className="flex items-center gap-1">
                  <span>AI đang gõ</span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ...
                  </motion.span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Hỏi về sự kiện UTEHY..."
              className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="p-2 bg-emerald-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View - FAB + Modal */}
      <div className="lg:hidden">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center z-50"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full h-[85vh] bg-white rounded-t-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-emerald-400">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Assistant
                    </h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                            message.isUser
                              ? 'bg-emerald-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-xl rounded-bl-md text-sm">
                          AI đang gõ...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-2 bg-emerald-500 text-white rounded-full disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};