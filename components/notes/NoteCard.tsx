'use client';

import React, { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Clock, AlignLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

// TODO: Define Note type
interface NoteCardProps {
  note: Note; // Use the Note type
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onDelete }) => {
  // State to hold the formatted date string, initialized to null
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  // useEffect runs only on the client, after initial render
  useEffect(() => {
    // Format the date as a relative time (e.g., "2 days ago")
    try {
      const relativeTime = formatDistanceToNow(new Date(note.updated_at), { addSuffix: true });
      setFormattedDate(relativeTime);
    } catch (error) {
      // Fallback to basic formatting if date-fns has an issue
      setFormattedDate(new Date(note.updated_at).toLocaleDateString());
    }
  }, [note.updated_at]);

  // Handle edit separately to avoid event bubbling
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    onEdit(note.id);
  };

  // Handle delete separately to avoid event bubbling
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from triggering
    onDelete(note.id);
  };

  // Calculate character count for display
  const charCount = note.content?.length || 0;

  return (
    <Card 
      className="h-full flex flex-col transition-all hover:shadow-md cursor-pointer border border-border/40 hover:border-primary/20"
      onClick={() => onEdit(note.id)}
    >
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-xl font-semibold line-clamp-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          {note.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {formattedDate ? formattedDate : 'Loading...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <div className="relative">
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {note.content ? note.content : 'No content'}
          </p>
          {charCount > 0 && (
            <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground/70 flex items-center gap-1">
              <AlignLeft className="h-3 w-3" />
              {charCount} characters
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t mt-6">
        <div className="flex gap-2">
          <Button onClick={handleEditClick} size="sm" variant="outline" className="h-7 px-2">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button onClick={handleDeleteClick} size="sm" variant="outline" className="h-7 px-2 text-destructive hover:text-destructive-foreground hover:bg-destructive">
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NoteCard; 