import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Plus } from "lucide-react";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  type: 'note' | 'edit' | 'decision';
  content: string;
  metadata?: {
    entity?: string;
    action?: string;
    previous?: string;
    current?: string;
  };
}

interface AuditPanelProps {
  entries: AuditEntry[];
  onAddNote: (note: string) => Promise<void>;
}

export function AuditPanel({ entries, onAddNote }: AuditPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    
    setIsSaving(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Add Note</h3>
        <div className="space-y-4">
          <Textarea
            placeholder="Enter your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleSaveNote}
            disabled={!newNote.trim() || isSaving}
            className="w-full"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-4 pr-4">
            {entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No activity recorded yet
              </div>
            ) : (
              entries.map((entry) => (
                <Card
                  key={entry.id}
                  className="p-4 border-l-4"
                  style={{
                    borderLeftColor:
                      entry.type === 'note'
                        ? 'var(--primary)'
                        : entry.type === 'decision'
                        ? 'var(--warning)'
                        : 'var(--muted)',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            entry.type === 'note'
                              ? 'default'
                              : entry.type === 'decision'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          by {entry.user}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {entry.metadata?.entity && (
                      <Badge variant="outline">{entry.metadata.entity}</Badge>
                    )}
                  </div>

                  <div className="text-sm">{entry.content}</div>

                  {entry.metadata && (entry.metadata.previous || entry.metadata.current) && (
                    <div className="mt-2 pt-2 border-t text-sm">
                      {entry.metadata.action && (
                        <div className="text-muted-foreground mb-1">
                          Action: {entry.metadata.action}
                        </div>
                      )}
                      {entry.metadata.previous && (
                        <div className="text-red-600 line-through mb-1">
                          {entry.metadata.previous}
                        </div>
                      )}
                      {entry.metadata.current && (
                        <div className="text-green-600">{entry.metadata.current}</div>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
