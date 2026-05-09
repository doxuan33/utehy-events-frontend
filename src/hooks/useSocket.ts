import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/v1', '') : 'http://localhost:3001';

export interface Question {
  id: string;
  content: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  upvotes: number;
  created_at: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  joinEvent: (eventId: string) => void;
  sendQuestion: (eventId: string, content: string) => void;
  upvoteQuestion: (eventId: string, questionId: string) => void;
  onNewQuestion: (callback: (question: Question) => void) => void;
  onUpdateVote: (callback: (data: { question_id: string; upvotes: number }) => void) => void;
}

export const useSocket = (): UseSocketReturn => {
  const token = useAuthStore(state => state.token);
  const socketRef = useRef<Socket | null>(null);

   useEffect(() => {
     if (!token) return;

     const socket = io(SOCKET_URL, {
       auth: { token },
       transports: ['websocket'],
     });

     socketRef.current = socket;

     socket.on('connect', () => {
       // Connection established
     });

     socket.on('disconnect', () => {
       // Disconnected
     });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinEvent = (eventId: string) => {
    socketRef.current?.emit('join_event', { event_id: eventId });
  };

  const sendQuestion = (eventId: string, content: string) => {
    socketRef.current?.emit('send_question', { event_id: eventId, content });
  };

  const upvoteQuestion = (eventId: string, questionId: string) => {
    socketRef.current?.emit('upvote_question', { event_id: eventId, question_id: questionId });
  };

  const onNewQuestion = (callback: (question: Question) => void) => {
    socketRef.current?.on('new_question', callback);
  };

  const onUpdateVote = (callback: (data: { question_id: string; upvotes: number }) => void) => {
    socketRef.current?.on('update_vote', callback);
  };

  return {
    socket: socketRef.current,
    joinEvent,
    sendQuestion,
    upvoteQuestion,
    onNewQuestion,
    onUpdateVote,
  };
};