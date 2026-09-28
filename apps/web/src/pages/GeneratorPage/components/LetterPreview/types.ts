export type PreviewView = 'loading' | 'queued' | 'empty' | 'failed' | 'letter';

// The line over a letter kept on screen while its successor is queued, failed, cut, or elsewhere.
export type KeptNoteKind = 'queued' | 'failed' | 'cut' | 'saved';
