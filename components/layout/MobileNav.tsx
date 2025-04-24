'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  StickyNote, 
  PlusCircle,
  Menu,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import LogoutButton from '@/components/auth/LogoutButton';
import { usePathname, useRouter } from 'next/navigation';
import { useNotes, useDeleteNote } from '@/hooks/useNotes';
import { toast } from 'sonner';
import { Note } from '@/types/note';
import { useQueryClient } from '@tanstack/react-query';

const MobileNav = () => {
  const [open, setOpen] = React.useState(false);
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
    
    // Close the mobile menu
    setOpen(false);
    
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 focus:ring-offset-0 md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="px-7">
          <Link
            href="/"
            className="flex items-center gap-2 py-3"
            onClick={() => setOpen(false)}
          >
            <StickyNote className="h-5 w-5" />
            <span className="font-bold">notes.</span>
          </Link>
        </div>
        
        <div className="flex flex-col gap-6 px-4 mt-6">
          <Button 
            className="w-full"
            onClick={() => {
              router.push('/');
              setOpen(false);  
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Note
          </Button>
          
          <div className="mt-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">My Notes</h3>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading notes...</p>
              ) : filteredNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              ) : (
                filteredNotes.map((note) => (
                  <div key={note.id} className="flex items-center group pr-1">
                    <Button
                      variant={pathname === `/notes/${note.id}` ? "secondary" : "ghost"}
                      className="flex-1 justify-start overflow-hidden"
                      onClick={() => {
                        router.push(`/notes/${note.id}`);
                        setOpen(false);
                      }}
                    >
                      <StickyNote className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{note.title || "Untitled Note"}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="h-7 w-7 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <LogoutButton className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav; 