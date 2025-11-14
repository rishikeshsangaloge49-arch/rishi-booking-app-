import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { ChatMessage } from '../types';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { SendIcon, PhoneIcon, EmailIcon } from './icons/Icons';

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
);


const ChatBotView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = () => {
            const session = createChatSession();
            setChat(session);
        };
        initChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { sender: 'USER', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await sendChatMessage(chat, input);
            const geminiMessage: ChatMessage = { sender: 'GEMINI', text: result.text };
            setMessages(prev => [...prev, geminiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { sender: 'GEMINI', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, chat, isLoading]);
    
    return (
        <div className="flex flex-col h-full bg-gray-100">
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Contact Support Directly</h2>
              <div className="space-y-2">
                <a href="tel:+918762042431" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                  <PhoneIcon className="w-5 h-5 mr-3 text-gray-500"/>
                  <span>+91 8762042431</span>
                </a>
                <a href="tel:+919108247369" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                  <PhoneIcon className="w-5 h-5 mr-3 text-gray-500"/>
                  <span>+91 9108247369</span>
                </a>
                <a href="mailto:rishikeshsangolge19@gmail.com" className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                  <EmailIcon className="w-5 h-5 mr-3 text-gray-500"/>
                  <span>rishikeshsangolge19@gmail.com</span>
                </a>
              </div>
            </div>

            <div className="flex-grow flex flex-col p-4 overflow-hidden">
                <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.sender === 'USER' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in-up">
                            <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm rounded-bl-none flex items-center space-x-3">
                               <TypingIndicator />
                               <span className="text-sm text-gray-500">Typing...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex items-center bg-white rounded-full shadow-md p-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for help..."
                        className="w-full bg-transparent border-none focus:ring-0 px-4 py-1 text-gray-700"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBotView;