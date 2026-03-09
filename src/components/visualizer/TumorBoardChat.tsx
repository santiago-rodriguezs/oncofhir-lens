'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Variant, Evidence, Therapy } from '@/core/models';
import type { TumorBoardMessage } from '@/lib/claude';
import { MessageCircle, Send, Trash2 } from 'lucide-react';

interface TumorBoardChatProps {
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
  tumorType?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the most actionable variants in this case?',
  'Are there any relevant clinical trials for this molecular profile?',
  'What resistance mechanisms should we monitor for?',
  'Can you summarize the therapeutic implications for tumor board discussion?',
  'Are there any drug-drug interactions to consider with the suggested therapies?',
];

export function TumorBoardChat({
  variants,
  evidence,
  therapies,
  tumorType,
}: TumorBoardChatProps) {
  const [messages, setMessages] = useState<TumorBoardMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (question?: string) => {
    const text = question || input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);

    const userMessage: TumorBoardMessage = { role: 'user', content: text };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          history: messages,
          variants,
          evidence,
          therapies,
          tumorType,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMessages([
        ...updatedHistory,
        { role: 'assistant', content: data.response },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error communicating with assistant'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold">Tumor Board Assistant</h3>
          <Badge variant="outline" className="text-xs">
            Claude Sonnet 4.6
          </Badge>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Ask questions about the patient&apos;s genomic profile.
              The assistant has context of all {variants.length} variants,{' '}
              {evidence.length} evidence items, and {therapies.length} therapy
              suggestions.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Suggested questions:
              </p>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 text-sm"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">Thinking...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about variants, therapies, clinical trials..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
