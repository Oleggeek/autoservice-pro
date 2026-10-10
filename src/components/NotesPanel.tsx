import { useState } from 'react';
import { Note } from '../types';
import { useAppContext } from '../store';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  notes: Note[];
  onUpdate: (notes: Note[]) => void;
  entityType: string;
}

export default function NotesPanel({ notes, onUpdate, entityType }: Props) {
  const { state } = useAppContext();
  const [newNote, setNewNote] = useState('');
  const [expanded, setExpanded] = useState(true);

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: uuidv4(),
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser?.id || '',
      createdByName: state.currentUser?.name || 'Неизвестно',
    };
    onUpdate([...notes, note]);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    onUpdate(notes.filter(n => n.id !== id));
  };

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 font-semibold text-slate-700 mb-2">
        <span>{expanded ? '▼' : '▶'}</span>
        📝 Внутренние заметки ({notes.length})
      </button>
      {expanded && (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.text}</p>
                <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">✕</button>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {note.createdByName} • {new Date(note.createdAt).toLocaleString('ru')}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={`Заметка для ${entityType}...`}
              className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-amber-500"
              rows={2}
            />
            <button onClick={addNote} className="bg-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-amber-600 self-end">
              Добавить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
