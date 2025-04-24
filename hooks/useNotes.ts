import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Note } from '@/types/note';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Flag to indicate if the summary column has been added to the database
// Set this to true after running the migration
const SUMMARY_COLUMN_EXISTS = true;

// Create a function to handle Supabase fetching
const fetchNotes = async (): Promise<Note[]> => {
  const supabase = createSupabaseBrowserClient();
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    if (error.message?.includes("Could not find the 'summary' column")) {
      console.error("The 'summary' column doesn't exist in the database. Please run the migration in the migrations folder.");
      throw new Error("Database needs to be updated. See migrations folder for instructions.");
    }
    throw error;
  }
  
  return data || [];
};

// Create a function to fetch a single note
const fetchNoteById = async (noteId: string): Promise<Note> => {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .single();
    
  if (error) {
    throw error;
  }
  
  return data;
};

// Create a function to delete a note
const deleteNote = async (noteId: string): Promise<void> => {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);
    
  if (error) {
    throw error;
  }
};

// Create a function to create a note
const createNote = async (data: Pick<Note, 'title' | 'content'> & { summary?: string }): Promise<void> => {
  const supabase = createSupabaseBrowserClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Authentication error: Cannot create note.');
  }
  
  // Prepare note data based on whether summary column exists
  const noteData = SUMMARY_COLUMN_EXISTS ? { 
    title: data.title,
    content: data.content,
    summary: data.summary || null,
    user_id: user.id
  } : {
    title: data.title,
    content: data.content,
    user_id: user.id
  };
  
  const { error } = await supabase
    .from('notes')
    .insert([noteData]);
    
  if (error) {
    if (error.message?.includes("Could not find the 'summary' column")) {
      console.error("The 'summary' column doesn't exist in the database. Please run the migration in the migrations folder.");
      throw new Error("Database needs to be updated. See migrations folder for instructions.");
    }
    throw error;
  }
};

// Create a function to update a note
const updateNote = async ({ 
  noteId, 
  data 
}: { 
  noteId: string; 
  data: Pick<Note, 'title' | 'content'> & { summary?: string }; 
}): Promise<void> => {
  const supabase = createSupabaseBrowserClient();
  
  // Prepare update data based on whether summary column exists
  const updateData = SUMMARY_COLUMN_EXISTS ? {
    title: data.title,
    content: data.content,
    summary: data.summary || null,
    updated_at: new Date().toISOString(),
  } : {
    title: data.title,
    content: data.content,
    updated_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', noteId);
    
  if (error) {
    if (error.message?.includes("Could not find the 'summary' column")) {
      console.error("The 'summary' column doesn't exist in the database. Please run the migration in the migrations folder.");
      throw new Error("Database needs to be updated. See migrations folder for instructions.");
    }
    throw error;
  }
};

// Hook for fetching all notes
export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: fetchNotes
  });
}

// Hook for fetching a single note
export function useNote(noteId: string) {
  return useQuery({
    queryKey: ['notes', noteId],
    queryFn: () => fetchNoteById(noteId),
    enabled: !!noteId // Only run the query if we have a noteId
  });
}

// Hook for deleting a note
export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteNote,
    // Add optimistic update
    onMutate: async (noteId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      
      // Snapshot the previous notes
      const previousNotes = queryClient.getQueryData<Note[]>(['notes']);
      
      // Optimistically update the notes list by filtering out the deleted note
      if (previousNotes) {
        queryClient.setQueryData<Note[]>(['notes'], 
          previousNotes.filter(note => note.id !== noteId)
        );
      }
      
      // Return a context object with the previous notes
      return { previousNotes };
    },
    // If the mutation fails, use the context we returned to roll back
    onError: (err, noteId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData<Note[]>(['notes'], context.previousNotes);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}

// Hook for creating a note
export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createNote,
    // Add optimistic update
    onMutate: async (newNoteData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      
      // Snapshot the previous notes
      const previousNotes = queryClient.getQueryData<Note[]>(['notes']) || [];
      
      // Create an optimistic note
      const optimisticNote: Note = {
        // Create a temporary ID (will be replaced by the server-generated one)
        id: `temp-${Date.now()}`,
        user_id: '', // This will be set by the server
        title: newNoteData.title,
        content: newNoteData.content || null,
        summary: SUMMARY_COLUMN_EXISTS ? (newNoteData.summary || null) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add the optimistic note to the notes list
      queryClient.setQueryData<Note[]>(['notes'], [optimisticNote, ...previousNotes]);
      
      // Return a context with the previous notes
      return { previousNotes };
    },
    // If the mutation fails, use the context returned to roll back
    onError: (err, newNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData<Note[]>(['notes'], context.previousNotes);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}

// Hook for updating a note
export function useUpdateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateNote,
    // Add optimistic update
    onMutate: async ({ noteId, data }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notes'] });
      await queryClient.cancelQueries({ queryKey: ['notes', noteId] });
      
      // Snapshot the previous data
      const previousNotes = queryClient.getQueryData<Note[]>(['notes']);
      const previousNote = queryClient.getQueryData<Note>(['notes', noteId]);
      
      // Optimistically update the single note if we have it cached
      if (previousNote) {
        const optimisticNote = {
          ...previousNote,
          title: data.title,
          content: data.content,
          summary: SUMMARY_COLUMN_EXISTS ? (data.summary || null) : previousNote.summary,
          updated_at: new Date().toISOString()
        };
        
        queryClient.setQueryData<Note>(['notes', noteId], optimisticNote);
      }
      
      // Optimistically update the notes list if we have it cached
      if (previousNotes) {
        const optimisticNotes = previousNotes.map(note => 
          note.id === noteId
            ? { 
                ...note, 
                title: data.title, 
                content: data.content,
                summary: SUMMARY_COLUMN_EXISTS ? (data.summary || null) : note.summary,
                updated_at: new Date().toISOString() 
              }
            : note
        );
        
        queryClient.setQueryData<Note[]>(['notes'], optimisticNotes);
      }
      
      // Return a context object with the previous data
      return { previousNotes, previousNote };
    },
    // If the mutation fails, use the context we returned to roll back
    onError: (err, variables, context) => {
      if (context?.previousNote) {
        queryClient.setQueryData<Note>(['notes', variables.noteId], context.previousNote);
      }
      if (context?.previousNotes) {
        queryClient.setQueryData<Note[]>(['notes'], context.previousNotes);
      }
    },
    // Always refetch after error or success
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] });
    }
  });
} 