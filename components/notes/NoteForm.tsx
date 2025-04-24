'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Note } from '@/types/note';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Type, AlignLeft } from "lucide-react";
import { fetchSummary } from '@/hooks/useSummarize';

interface NoteFormData {
  title: string;
  content: string;
  summary?: string;
}

interface NoteFormProps {
  note?: Note;
  onSubmit: (formData: NoteFormData) => Promise<void>;
  isSubmitting?: boolean;
  onContentChange?: (content: string) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ 
  note, 
  onSubmit, 
  isSubmitting = false,
  onContentChange 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Use useEffect to set initial state when editing an existing note
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setCharCount(note.content?.length || 0);
      
      // Update contentEditable div
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = note.content || '';
      }
    }
  }, [note]);

  // Handle content changes
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
    setCharCount(newContent.length);
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Only attempt to get a summary if there's sufficient content
    let summary = undefined;
    if (content.length > 10) {
      try {
        const summaryResult = await fetchSummary(content);
        if (summaryResult.summary) {
          summary = summaryResult.summary;
        }
      } catch (error) {
        console.error("Failed to generate summary:", error);
        // Continue with submission even if summary fails
      }
    }
    
    // Submit the form with the title, content, and automatically generated summary
    await onSubmit({ title, content, summary });
    
    // Optionally clear form after submit, depending on usage (e.g., only for create)
    if (!note) {
      setTitle('');
      setContent('');
      setCharCount(0);
      if (contentEditableRef.current) {
        contentEditableRef.current.textContent = '';
      }
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="title" className="text-base flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                Title
              </Label>
              {title && <div className="text-xs text-muted-foreground">
                {title.length} characters
              </div>}
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Enter a descriptive title..."
              className="pl-3 pr-3 py-2 h-12 text-base"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content" className="text-base flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-primary" />
                Content
              </Label>
              {content && <div className="text-xs text-muted-foreground">
                {charCount} characters
              </div>}
            </div>
            
            <Card className="border">
              <CardContent className="p-0">
                <div className="relative">
                  <ScrollArea className="h-[250px]">
                    <div 
                      ref={contentEditableRef}
                      className="min-h-[250px] p-4 outline-none w-full focus:ring-0 focus-visible:ring-0"
                      contentEditable={!isSubmitting}
                      suppressContentEditableWarning
                      onInput={handleContentChange}
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: '1.5'
                      }}
                    />
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !title || !content} 
            className="w-full md:w-auto px-8"
            size="lg"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {note ? 'Update Note' : 'Create Note'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NoteForm; 