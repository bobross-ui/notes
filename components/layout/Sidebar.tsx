'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  StickyNote, 
  PlusCircle,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotes, useDeleteNote } from '@/hooks/useNotes';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { Note } from '@/types/note';
import { useQueryClient } from '@tanstack/react-query';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: notes = [], isLoading } = useNotes();
  const deleteNoteMutation = useDeleteNote();
  const queryClient = useQueryClient();
  
  // Track notes pending deletion
  const [pendingDeletionIds, setPendingDeletionIds] = useState<string[]>([]);
  // Store references to deletion timeouts
  const timeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});
  // Store deleted notes for potential restoration
  const deletedNotesRef = React.useRef<Record<string, Note>>({});

  const handleDeleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    e.preventDefault(); // Prevent any default actions
    
    // Find the note being deleted
    const noteToDelete = notes.find(note => note.id === noteId);
    if (!noteToDelete) return;
    
    // Store the note for potential restoration
    deletedNotesRef.current[noteId] = noteToDelete;
    
    // Mark as pending deletion (to hide from UI)
    setPendingDeletionIds(prev => [...prev, noteId]);
    
    // Clear any existing timeout
    if (timeoutRefs.current[noteId]) {
      clearTimeout(timeoutRefs.current[noteId]);
    }
    
    // Set timeout to delete after delay
    const timeoutId = setTimeout(async () => {
      try {
        await deleteNoteMutation.mutateAsync(noteId);
        // Clean up references
        delete deletedNotesRef.current[noteId];
        delete timeoutRefs.current[noteId];
        
        // Update UI state
        setPendingDeletionIds(prev => prev.filter(id => id !== noteId));
        
        toast('Note permanently deleted', {
          description: 'The note has been removed from your account',
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        toast('Failed to delete note', {
          description: 'There was an error deleting your note',
        });
        // Make visible again on error
        setPendingDeletionIds(prev => prev.filter(id => id !== noteId));
      }
    }, 5000); // 5 second delay
    
    // Store timeout reference
    timeoutRefs.current[noteId] = timeoutId;
    
    // Show toast with undo option
    toast('Note moved to trash', {
      description: 'Note will be permanently deleted in 5 seconds',
      action: {
        label: 'Undo',
        onClick: () => handleUndoDelete(noteId)
      },
      duration: 5000,
    });
    
    // Navigate away if the deleted note was being viewed
    if (pathname === `/notes/${noteId}`) {
      router.push('/');
    }
  };
  
  const handleUndoDelete = (noteId: string) => {
    // Clear deletion timeout
    if (timeoutRefs.current[noteId]) {
      clearTimeout(timeoutRefs.current[noteId]);
      delete timeoutRefs.current[noteId];
    }
    
    // Make note visible again
    setPendingDeletionIds(prev => prev.filter(id => id !== noteId));
    
    // Restore note in cache
    const cachedNotes = queryClient.getQueryData<Note[]>(['notes']) || [];
    if (!cachedNotes.some(note => note.id === noteId) && deletedNotesRef.current[noteId]) {
      queryClient.setQueryData<Note[]>(
        ['notes'], 
        [...cachedNotes, deletedNotesRef.current[noteId]]
      );
    }
    
    // Clean up reference
    delete deletedNotesRef.current[noteId];
    
    toast('Note restored successfully', {
      description: 'Your note has been restored',
    });
  };

  // Filter out notes pending deletion
  const filteredNotes = notes.filter(note => !pendingDeletionIds.includes(note.id));

  return (
    <div className="flex flex-col border-r bg-background px-2 md:px-4 py-4 hidden md:flex w-[280px] h-full">
      <div className="flex flex-col justify-between flex-1">
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 flex-shrink-0">
            <Button 
              className="w-full"
              onClick={() => router.push('/')}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </div>
          
          <div className="flex-shrink-0">            
            <h2 className="px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">My Notes</h2>            
          </div>
          
          {/* Notes List Section */}
          <div className="px-2 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground px-4">Loading notes...</p>
                ) : filteredNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-4">No notes yet</p>
                ) : (
                  filteredNotes.map((note) => (
                    <div key={note.id} className="flex items-center group pr-1">
                      <Button
                        variant={pathname === `/notes/${note.id}` ? "secondary" : "ghost"}
                        className="flex-1 justify-start overflow-hidden mr-1 max-w-[85%]"
                        onClick={() => router.push(`/notes/${note.id}`)}
                      >
                        <StickyNote className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{note.title || "Untitled Note"}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="h-7 w-7 p-0 min-w-[28px] flex-shrink-0 text-muted-foreground hover:text-destructive opacity-80 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <div className="px-6 py-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Notes App
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 