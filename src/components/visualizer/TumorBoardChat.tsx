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
import { ApiErrorBanner } from '@/components/ApiErrorBanner';
import { useModelStore } from '@/lib/store/model';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TumorBoardChatProps {
  variants: Variant[];
  evidence: Evidence[];
  therapies: Therapy[];
  tumorType?: string;
}

const SUGGESTED_QUESTIONS = [
  '¿Cuáles son las variantes más accionables en este caso?',
  '¿Hay ensayos clínicos relevantes para este perfil molecular?',
  '¿Qué mecanismos de resistencia deberíamos monitorear?',
  '¿Podés resumir las implicancias terapéuticas para la discusión del tumor board?',
  '¿Hay interacciones farmacológicas a considerar con las terapias sugeridas?',
];

export function TumorBoardChat({
  variants,
  evidence,
  therapies,
  tumorType,
}: TumorBoardChatProps) {
  const { model } = useModelStore();
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
        headers: { 'Content-Type': 'application/json', 'x-claude-model': model },
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
        err instanceof Error ? err.message : 'Error al comunicarse con el asistente'
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
          <h3 className="font-semibold">Asistente de Tumor Board</h3>
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
            Limpiar
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Hacé preguntas sobre el perfil genómico del paciente.
              El asistente tiene contexto de las {variants.length} variantes,{' '}
              {evidence.length} ítems de evidencia y {therapies.length} sugerencias
              terapéuticas.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Preguntas sugeridas:
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
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-table:my-2 prose-hr:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">Pensando...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 border-t">
          <ApiErrorBanner error={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntá sobre variantes, terapias, ensayos clínicos..."
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
