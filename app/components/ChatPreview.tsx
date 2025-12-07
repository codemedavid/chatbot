'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Paperclip, RotateCcw } from 'lucide-react';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

export default function ChatPreview() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: "Hi, I'm TestBot! How can I help with your documents?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Generate a NEW session ID each time the component mounts
    // This prevents old conversation history from affecting new chats
    useEffect(() => {
        const newId = `web_test_${Date.now()}`;
        setSessionId(newId);
        console.log('[ChatPreview] New test session:', newId);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Clear chat and start fresh
    const handleClearChat = () => {
        const newId = `web_test_${Date.now()}`;
        setSessionId(newId);
        setMessages([
            { role: 'bot', content: "Chat cleared! I'm ready for fresh questions. 😊" }
        ]);
        console.log('[ChatPreview] Chat cleared, new session:', newId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, sessionId }),
            });

            const data = await res.json();
            setMessages((prev) => [...prev, { role: 'bot', content: data.reply }]);

            // Store session ID if returned
            if (data.sessionId && !sessionId) {
                setSessionId(data.sessionId);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [...prev, { role: 'bot', content: 'Sorry, I encountered an error.' }]);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full flex-shrink-0">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Bot className="text-teal-600" size={20} />
                <h2 className="font-semibold text-gray-800 flex-1">TestBot</h2>
                <button
                    onClick={handleClearChat}
                    className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                    title="Clear chat & start fresh"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
                <div className="text-center text-xs text-gray-400 my-2">Today</div>

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-teal-600 text-white'
                            }`}>
                            {msg.role === 'user' ? 'U' : <Bot size={16} />}
                        </div>

                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                            ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100'
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
                        disabled={loading}
                    />
                    <div className="absolute right-2 top-1.5 flex items-center gap-1">
                        <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600">
                            <Paperclip size={18} />
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="p-1.5 text-teal-600 hover:text-teal-700 disabled:text-gray-300"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
