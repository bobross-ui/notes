'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes, useDeleteNote, useCreateNote } from '@/hooks/useNotes';
import NoteForm from '@/components/notes/NoteForm';
import { notifyError } from '@/lib/utils/notifications';
import { ErrorMessage } from '@/components/ui/error-message';
import { LoadingState } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Note } from '@/types/note';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const router = useRouter();
  const [pendingDeletionIds, setPendingDeletionIds] = useState<string[]>([]);
  const pendingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Replace manual state management with React Query hooks
  const { data: notes = [] } = useNotes();
  const deleteNoteMutation = useDeleteNote();
  const createNoteMutation = useCreateNote();
  const queryClient = useQueryClient();
  
  // Keep a reference to the deleted notes for restoration
  const deletedNotesRef = useRef<Record<string, Note>>({});

  const handleDeleteNote = (noteId: string) => {
    // Find the note that's being deleted to save for potential restore
    const noteToDelete = notes.find(note => note.id === noteId);
    if (!noteToDelete) return;
    
    // Store the note that's being deleted
    deletedNotesRef.current[noteId] = noteToDelete;
    
    // Add to pending deletion list to hide from UI
    setPendingDeletionIds(prev => [...prev, noteId]);
    
    // Clear any existing timeout for this note
    if (pendingTimeoutsRef.current[noteId]) {
      clearTimeout(pendingTimeoutsRef.current[noteId]);
    }
    
    // Set a timeout to actually delete the note after a delay
    const timeoutId = setTimeout(async () => {
      try {
        await deleteNoteMutation.mutateAsync(noteId);
        // Remove from our references once successfully deleted
        delete deletedNotesRef.current[noteId];
        delete pendingTimeoutsRef.current[noteId];
        
        // Also update the pending deletion IDs state
        setPendingDeletionIds(prev => prev.filter(id => id !== noteId));
        
        toast('Note permanently deleted', {
          description: 'The note has been removed from your account',
        });
      } catch (error) {
        console.error('Error deleting note:', error);
        notifyError('Failed to delete note', {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        // Remove from pending deletion to make it visible again if deletion failed
        setPendingDeletionIds(prev => prev.filter(id => id !== noteId));
      }
    }, 5000); // 5 second delay
    
    // Store the timeout ID
    pendingTimeoutsRef.current[noteId] = timeoutId;
    
    // Show toast with undo option
    toast('Note moved to trash', {
      description: 'Note will be permanently deleted in 5 seconds',
      action: {
        label: 'Undo',
        onClick: () => handleUndoDelete(noteId)
      },
      duration: 5000,
    });
  };
  
  const handleUndoDelete = (noteId: string) => {
    // Clear the deletion timeout
    if (pendingTimeoutsRef.current[noteId]) {
      clearTimeout(pendingTimeoutsRef.current[noteId]);
      delete pendingTimeoutsRef.current[noteId];
    }
    
    // Remove from pending deletion IDs to make it visible again
    setPendingDeletionIds(prev => prev.filter(id => id !== noteId));
    
    // Manually update the React Query cache to ensure the UI updates
    const cachedNotes = queryClient.getQueryData<Note[]>(['notes']) || [];
    
    // Only restore if the note isn't already in the cache
    if (!cachedNotes.some(note => note.id === noteId) && deletedNotesRef.current[noteId]) {
      queryClient.setQueryData<Note[]>(
        ['notes'], 
        [...cachedNotes, deletedNotesRef.current[noteId]]
      );
    }
    
    // Remove from deleted notes ref
    delete deletedNotesRef.current[noteId];
    
    toast('Note restored successfully', {
      description: 'Your note has been restored',
    });
  };

  const handleCreateNote = async (formData: { title: string; content: string; summary?: string }) => {
    try {
      // First create the note using the mutation
      await createNoteMutation.mutateAsync(formData);
      
      // Then fetch the latest notes to find the newly created one
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      // Get the updated notes list
      const updatedNotes = queryClient.getQueryData<Note[]>(['notes']) || [];
      
      // Find the most recently created note (which should be our new note)
      // Sort by created_at in descending order
      const latestNote = [...updatedNotes].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      toast('Note created successfully', {
        description: 'Your new note has been saved',
      });
      
      // Navigate to the note view page if we found the latest note
      if (latestNote) {
        router.push(`/notes/${latestNote.id}`);
      } else {
        // Fallback to home page if we couldn't find the latest note
        router.push('/');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      notifyError('Failed to create note', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-8 pt-4">
      <Card className="border shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Book className="h-5 w-5 text-primary" />
            Create New Note
          </CardTitle>
          <CardDescription>
            Create a new note with a title and content. Your notes are automatically saved and can be accessed anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NoteForm 
            onSubmit={handleCreateNote} 
            isSubmitting={createNoteMutation.isPending}
          />
          {createNoteMutation.isPending && <LoadingState text="Creating note..." className="mt-4" />}
          {createNoteMutation.isError && (
            <ErrorMessage 
              title="Error creating note"
              error={createNoteMutation.error}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 