'use client';

import React from 'react';
import { Note } from '@/types/note';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { Clock, AlignLeft, FileText, Sparkles } from 'lucide-react';

interface ReadOnlyNoteProps {
  note: Note;
}

// Helper function to format summary text with proper styling
const formatSummary = (text: string | null): React.ReactNode[] => {
  if (!text) return [<p key="empty"></p>];
  
  // Pre-process: Remove any introductory phrases if they slip through
  let processedText = text.replace(/^(here['']s a (concise |brief |)summary( of.*?)?:)/i, '').trim();
  
  // Split text into lines
  const lines = processedText.split('\n').filter(line => line.trim() !== '');
  
  return lines.map((line, index) => {
    // Clean line to handle any formatting issues
    const cleanedLine = line.trim();
    
    // Check for headings (lines with ** pattern)
    // Match ** Text ** or **Text** formats
    if (cleanedLine.match(/\*\*(.+?)\*\*/)) {
      const headingText = cleanedLine.replace(/\*\*/g, '').trim();
      return (
        <h4 key={index} className="font-semibold mb-2 mt-3">
          {headingText}
        </h4>
      );
    }
    
    // Check for bullet points (either * or • at start of line)
    if (cleanedLine.match(/^[•*]\s*/)) {
      const content = cleanedLine.replace(/^[•*]\s*/, '').trim();
      return (
        <div key={index} className="flex mb-2 ml-1">
          <span className="mr-2 text-primary flex-shrink-0">•</span>
          <span>{content}</span>
        </div>
      );
    }
    
    // Regular paragraph
    return <p key={index} className="mb-2">{cleanedLine}</p>;
  });
};

const ReadOnlyNote: React.FC<ReadOnlyNoteProps> = ({ note }) => {
  // Format the date as a relative time
  let formattedDate;
  try {
    formattedDate = formatDistanceToNow(new Date(note.updated_at), { addSuffix: true });
  } catch (error) {
    formattedDate = new Date(note.updated_at).toLocaleDateString();
  }

  // Calculate character count for display
  const charCount = note.content?.length || 0;

  return (
    <Card className="w-full border shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {note.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm">
          <Clock className="h-4 w-4" />
          Last updated {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-4">
          {/* Display summary if available */}
          {note.summary && (
            <div className="bg-muted/50 p-4 rounded-md mb-6">
              <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Summary</span>
              </div>
              <div className="summary-content text-sm">
                {formatSummary(note.summary)}
              </div>
            </div>
          )}
          
          <div className="prose max-w-none">
            {note.content ? (
              <div className="whitespace-pre-wrap text-base leading-relaxed">{note.content}</div>
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <AlignLeft className="h-3 w-3" />
          {charCount} characters
        </div>
        <div>
          Created: {new Date(note.created_at).toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReadOnlyNote; 