'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNote, useUpdateNote } from '@/hooks/useNotes';
import NoteForm from '@/components/notes/NoteForm';
import ReadOnlyNote from '@/components/notes/ReadOnlyNote';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Eye } from 'lucide-react';
import { notifyError } from '@/lib/utils/notifications';
import { ErrorMessage } from '@/components/ui/error-message';
import { LoadingState } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId as string;
  
  // State to track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Replace manual state management with React Query hooks
  const { data: note, isLoading, error: noteError } = useNote(noteId);
  const updateNoteMutation = useUpdateNote();

  const handleUpdateNote = async (formData: { title: string; content: string; summary?: string }) => {
    try {
      await updateNoteMutation.mutateAsync({
        noteId,
        data: formData
      });
      toast('Note updated successfully', {
        description: 'Your changes have been saved',
      });
      
      // Switch back to read-only mode after saving
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating note:', error);
      notifyError('Failed to update note', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // Toggle between edit and read-only modes
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  if (isLoading) {
    return <LoadingState text="Loading note details..." />;
  }

  if (noteError) {
    return (
      <div className="space-y-4">
        <ErrorMessage 
          title="Error loading note"
          error={noteError}
        />
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-4">
        <ErrorMessage 
          title="Note not found"
          error="The note couldn't be found or may have been deleted"
        />
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-8 pt-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{note.title}</h1>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={toggleEditMode} 
            variant="outline"
            size="sm"
            className="border gap-2"
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4" />
                View Mode
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Edit Mode
              </>
            )}
          </Button>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {isEditMode ? (
        // Edit Mode
        <Card className="border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Note
            </CardTitle>
            <CardDescription>
              Make changes to your note. Changes will be saved when you click the save button.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NoteForm 
              note={note} 
              onSubmit={handleUpdateNote} 
              isSubmitting={updateNoteMutation.isPending} 
            />
          </CardContent>
          {updateNoteMutation.isPending && (
            <CardFooter className="pt-4">
              <LoadingState text="Updating note..." className="w-full" />
            </CardFooter>
          )}
          {updateNoteMutation.isError && (
            <CardFooter className="pt-4">
              <ErrorMessage 
                title="Error updating note"
                error={updateNoteMutation.error}
                className="w-full"
              />
            </CardFooter>
          )}
        </Card>
      ) : (
        // Read-only Mode
        <ReadOnlyNote note={note} />
      )}
    </div>
  );
} 