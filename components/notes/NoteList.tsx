'use client';

import React from 'react';
import NoteCard from './NoteCard';
import { Note } from '@/types/note'; // Import the Note type

// TODO: Define Note type
interface NoteListProps {
  notes: Note[]; // Use the Note type
  onEditNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const NoteList: React.FC<NoteListProps> = ({ notes, onEditNote, onDeleteNote }) => {
  if (!notes || notes.length === 0) {
    return <p>No notes yet. Create one!</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Added basic grid layout */}
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      ))}
    </div>
  );
};

export default NoteList; 