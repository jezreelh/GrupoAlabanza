export interface User {
  _id: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy?: User | string;
  members?: Array<User | string>;
  moderators?: Array<User | string>;
  invitationCode?: string;
  invitationsEnabled?: boolean;
  createdAt?: string;
}

export interface Song {
  _id: string;
  title: string;
  author: string;
  category?: string;
  key?: string;
  tempo?: string;
  lyrics?: string;
  chords?: string;
  tags?: string[];
  lastPlayed?: string;
  playHistory?: PlayHistoryItem[];
  group?: Group | string;
  mediaLinks?: MediaLink[];
  createdBy?: User | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SongModification {
  song: Song | string;
  modifiedLyrics?: string;
  modifiedChords?: string;
  notes?: string;
  position?: number;
}

export interface Version {
  _id: string;
  name: string;
  notes?: string;
  songModifications: SongModification[];
  createdAt?: string;
}

export interface PlayHistoryItem {
  _id?: string;
  date: string;
  notes?: string;
  event?: string;
  versionIndex?: number;
}

export interface MediaLink {
  _id: string;
  title: string;
  url: string;
  platform?: string;
}

export interface Repertoire {
  _id: string;
  name: string;
  date?: string;
  description?: string;
  category?: string;
  group?: Group | string;
  songs?: Song[];
  versions?: Version[];
  playHistory?: PlayHistoryItem[];
  mediaLinks?: MediaLink[];
  createdBy?: User | string;
  createdAt?: string;
  updatedAt?: string;
} 