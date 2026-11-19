import { Request } from 'express';

export type EventType = 
  | 'Cleanup'
  | 'Plantation'
  | 'Donation'
  | 'Food Relief'
  | 'Healthcare'
  | 'Education'
  | 'Blood Donation'
  | 'Disaster Relief';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  photoURL?: string;
  provider?: 'credentials' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  _id?: string;
  title: string;
  description: string;
  eventType: EventType;
  thumbnail: string;
  location: string;
  eventDate: string; // ISO string format YYYY-MM-DD or YYYY-MM-DDTHH:mm
  creatorEmail: string;
  creatorName: string;
  creatorPhoto?: string;
  participantCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventJoin {
  _id?: string;
  eventId: string;
  eventTitle: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  joinedAt: Date;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}
