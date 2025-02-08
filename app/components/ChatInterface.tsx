'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Chat, ChatState } from '../types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateResponse } from "@/lib/gemini";
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Mic, Languages, Type, MoreVertical, Lock, Unlock, Edit2, Trash, Scan, PenTool, Sparkles, Delete, Copy } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ThemeToggle } from './ThemeToggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const constraints = `
do not write every point as a separate heading
`;

const tones = ["Professional", "Casual", "Bureaucratic"] as const
type Tone = (typeof tones)[number]

export default function ChatInterface() {
  const [chatState, setChatState] = useLocalStorage<ChatState>('chat-state', {
    chats: [],
    activeChat: null,
  });

  const [chats, setChats] = useState<Chat[]>(chatState.chats || []);
  const [activeChatId, setActiveChatId] = useState<string | null>(chatState.activeChat);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockDialog, setUnlockDialog] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(chat => chat.id === activeChatId);

  const tones = ["Casual", "Professional", "Diplomatic"] as const
  type Mood = (typeof tones)[number]

  const [currentMode, setCurrentMode] = useState<Mood>("Professional")

  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [essay, setEssay] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTone, setCurrentTone] = useState<Tone>("Professional")

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.essay]);

  useEffect(() => {
    setChatState({ chats, activeChat: activeChatId });
  }, [chats, activeChatId]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New Chat`,
      essay: '',
      keywords: []
    };

    setTitle('');
    setKeywords([]);
    setEssay('');

    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
  };

  const handleRename = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setNewTitle(chat.title);
      setIsRenaming(true);
    }
  };

  const saveNewTitle = () => {
    if (!newTitle.trim()) return;
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChatId ? { ...chat, title: newTitle, updatedAt: Date.now() } : chat
      )
    );
    setIsRenaming(false);
    setNewTitle('');
  };

  const handleDelete = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const handleLock = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat && !chat.isLocked) {
      setIsLocking(true);
    }
  };

  const saveLock = () => {
    if (!password.trim()) return;
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChatId ? { ...chat, isLocked: true, password, updatedAt: Date.now() } : chat
      )
    );
    setIsLocking(false);
    setPassword('');
  };

  const handleUnlock = (chatId: string) => {
    setUnlockDialog(chatId);
    setUnlockPassword('');
    setUnlockError('');
  };

  const tryUnlock = () => {
    const chat = chats.find(c => c.id === unlockDialog);
    if (chat && chat.password === unlockPassword) {
      setChats(prev =>
        prev.map(c =>
          c.id === unlockDialog ? { ...c, isLocked: false, password: undefined } : c
        )
      );
      setUnlockDialog(null);
      setUnlockPassword('');
      setUnlockError('');
      setEssay(chat.essay);
      setTitle(chat.title);
    //   setKeywords(chat.keywords || [])
    } else {
      setUnlockError('Incorrect password');
    }
  };

  const handleChatSelect = (chatId: string) => {
    setTitle('');
    setKeywords([]);
    const chat = chats.find(c => c.id === chatId);
    if (chat && chat.isLocked) {
      handleUnlock(chatId);
      setActiveChatId(chatId);
    } else {
        if (chat) {
            setEssay(chat?.essay || '')
            setTitle(chat?.title || '')
        }
      setActiveChatId(chatId);
    }
  };

  const addKeyword = () => {
    if (currentKeyword && !keywords.includes(currentKeyword)) {
      setKeywords([...keywords, currentKeyword]);
      setCurrentKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const copyTextToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(essay);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const [text, setText] = useState("");
  const [languageCode, setLanguageCode] = useState("en-US");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleSpeak = async () => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, languageCode }),
      });

      const data = await response.json();

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      } else {
        alert("Failed to generate audio");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAIResponse = async () => {
    if (!title) return;
    setLoading(true);

    let prompt = `Write an informational writeup on "${title}". Here are the points to be written about- ${keywords.join(', ')}`;
    prompt += '. ' + constraints;
    prompt += 'The tone and mood of the writeup must be' + {currentMode}

    let response = await generateResponse(prompt);
    response = response.replace(/[*#]/g, '');
    setEssay(response);

    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChatId ? { ...chat, title: title, essay: response } : chat
      )
    );

    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Section */}
      <div className="w-64 border-r bg-card">
        <div className="p-4 flex items-center justify-between">
          <Button className="flex-1 mr-2" onClick={createNewChat}>
            <MessageSquare className="mr-2 h-4 w-4" />
            New Writeup
          </Button>
          <ThemeToggle />
        </div>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-accent group ${chat.id === activeChatId ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1" onClick={() => handleChatSelect(chat.id)}>
                  <div className="flex items-center">
                    {chat.isLocked && <Lock className="h-3 w-3 mr-2 text-muted-foreground" />}
                    <p className="font-medium truncate">{chat.title}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRename(chat.id)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => chat.isLocked ? handleUnlock(chat.id) : handleLock(chat.id)}>
                      {chat.isLocked ? (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Lock
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(chat.id)}>
                      <Delete className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What Are We Writing About?"
                  className="flex-1 h-16 text-3xl font-bold bg-white-4 border-none"
                />
              </div>
              <div className = 'mt-3'>
              <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  placeholder="Add keywords and main points"
                  className="bg-white-4 border-none focus:bg-white-4 transition-all duration-300 focus:ring-2 focus:ring-yellow-4 placeholder-yellow-3"
                  onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                />
                <Button
                  onClick={addKeyword}
                >
                  Add
                </Button>
              </div>
              <motion.div layout className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {keywords.map((keyword) => (
                    <motion.span
                      key={keyword}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2"
                      >
                        <Trash className="w-4 stroke-grey-4 h-4" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </motion.div> 
            </div>
            <Tabs value={currentTone} onValueChange={(value : string) => setCurrentTone(value as Tone)} className="w-full max-w-[600px]">
                <TabsList className="grid w-full grid-cols-3">
                    {tones.map((tone) => (
                    <TabsTrigger key={tone} value={tone} className="text-sm font-medium">
                        {tone}
                    </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="flex-1 p-4">
              <Textarea
                value={essay}
                disabled={loading || essay === ''}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="Generated text will appear here..."
                className="w-full h-64 p-4 text-lg resize-none"
                />
              </div>
              <Button
                    disabled={loading || essay === ''}
                    onClick={copyTextToClipboard}
                    className = 'ml-4 rounded-full'
                >
                    Copy To Clipboard 
                    <Copy className={`ml-3 h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
                </Button>
              <div className = 'mt-4 pl-4 pr-4 flex-1 align-center'>
                <Button
                        className = 'w-full flex-1 align-center'
                        onClick={fetchAIResponse}
                        disabled={!title || keywords.length === 0 || loading}
                    >
                    {loading ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                        <Sparkles className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <>
                        <PenTool className="w-6 h-6 mr-2" />
                            GENERATE!
                        </>
                    )}
                </Button>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat or create a new one to get started
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new title"
            className="my-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewTitle}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Dialog */}
      <Dialog open={isLocking} onOpenChange={setIsLocking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Chat</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="my-4"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLocking(false)}>
              Cancel
            </Button>
            <Button onClick={saveLock}>Lock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog open={!!unlockDialog} onOpenChange={() => setUnlockDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Chat</DialogTitle>
          </DialogHeader>
          <Input
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            placeholder="Enter password"
            className="my-4"
          />
          {unlockError && (
            <p className="text-sm text-destructive mb-4">{unlockError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockDialog(null)}>
              Cancel
            </Button>
            <Button onClick={tryUnlock}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}