import { useEffect, useState, useCallback, useRef } from 'react';
import { IncidentCollaborationEngine } from './incident-collaboration';
import { PresenceState, Participant, CommunicationMessage, TeamAssignment, ActivityEvent } from './types';

export function useIncidentCollaboration(incidentId: string, userId: string, wsUrl: string) {
  const [engine, setEngine] = useState<IncidentCollaborationEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initEngine = async () => {
      try {
        const newEngine = new IncidentCollaborationEngine(incidentId, userId, wsUrl);
        await newEngine.initialize();
        setEngine(newEngine);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
        setLoading(false);
      }
    };

    initEngine();

    return () => {
      engine?.disconnect();
    };
  }, [incidentId, userId, wsUrl]);

  return { engine, loading, error };
}

export function usePresence(presenceManager: any) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!presenceManager) return;

    const updatePresence = () => {
      setOnlineUsers(presenceManager.getOnlineUsers());
    };

    presenceManager.on('presence:updated', updatePresence);
    presenceManager.on('user:joined', updatePresence);
    presenceManager.on('user:left', updatePresence);

    updatePresence();

    return () => {
      presenceManager.off('presence:updated', updatePresence);
      presenceManager.off('user:joined', updatePresence);
      presenceManager.off('user:left', updatePresence);
    };
  }, [presenceManager]);

  return { onlineUsers };
}

export function useWarRoom(warRoom: any) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    if (!warRoom) return;

    const updateParticipants = () => {
      setParticipants(warRoom.getParticipants());
      setActiveCount(warRoom.getActiveParticipants().length);
    };

    warRoom.on('participant:joined', updateParticipants);
    warRoom.on('participant:left', updateParticipants);

    updateParticipants();

    return () => {
      warRoom.off('participant:joined', updateParticipants);
      warRoom.off('participant:left', updateParticipants);
    };
  }, [warRoom]);

  return { participants, activeCount };
}

export function useMessages(channel: any, limit: number = 100) {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!channel) return;

    const updateMessages = () => {
      setMessages(channel.getMessages(limit));
    };

    const handleTyping = (users: string[]) => {
      setTypingUsers(users);
    };

    channel.on('message:sent', updateMessages);
    channel.on('message:edited', updateMessages);
    channel.on('message:deleted', updateMessages);
    channel.on('users:typing', handleTyping);

    updateMessages();

    return () => {
      channel.off('message:sent', updateMessages);
      channel.off('message:edited', updateMessages);
      channel.off('message:deleted', updateMessages);
      channel.off('users:typing', handleTyping);
    };
  }, [channel, limit]);

  return { messages, typingUsers };
}

export function useSyncStatus(syncEngine: any) {
  const [status, setStatus] = useState('offline');
  const [latency, setLatency] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!syncEngine) return;

    const updateStatus = () => {
      setStatus(syncEngine.getStatus());
      setLatency(syncEngine.getLatency());
      setPendingCount(syncEngine.getPendingSyncCount());
    };

    syncEngine.on('sync:complete', updateStatus);
    syncEngine.on('sync:error', updateStatus);
    syncEngine.on('sync:acknowledged', updateStatus);

    updateStatus();

    const interval = setInterval(updateStatus, 5000);

    return () => {
      clearInterval(interval);
      syncEngine.off('sync:complete', updateStatus);
      syncEngine.off('sync:error', updateStatus);
      syncEngine.off('sync:acknowledged', updateStatus);
    };
  }, [syncEngine]);

  return { status, latency, pendingCount };
}

export function useTeamAssignments(assignmentManager: any) {
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [workload, setWorkload] = useState<Array<any>>([]);

  useEffect(() => {
    if (!assignmentManager) return;

    const updateAssignments = () => {
      setAssignments(assignmentManager.getAssignments());
      setWorkload(assignmentManager.getWorkload('current-incident'));
    };

    assignmentManager.on('assignment:created', updateAssignments);
    assignmentManager.on('assignment:updated', updateAssignments);
    assignmentManager.on('assignment:completed', updateAssignments);

    updateAssignments();

    return () => {
      assignmentManager.off('assignment:created', updateAssignments);
      assignmentManager.off('assignment:updated', updateAssignments);
      assignmentManager.off('assignment:completed', updateAssignments);
    };
  }, [assignmentManager]);

  return { assignments, workload };
}

export function useActivityTimeline(timeline: any, limit: number = 50) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!timeline) return;

    const updateActivities = () => {
      setActivities(timeline.getActivities(limit));
      setStats(timeline.getTimelineStats('current-incident'));
    };

    timeline.on('activity:recorded', updateActivities);

    updateActivities();

    const interval = setInterval(updateActivities, 10000);

    return () => {
      clearInterval(interval);
      timeline.off('activity:recorded', updateActivities);
    };
  }, [timeline, limit]);

  return { activities, stats };
}

export function useNotifications(notificationManager: any) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!notificationManager) return;

    const updateNotifications = () => {
      setUnreadCount(notificationManager.getUnreadCount('current-user'));
      setNotifications(notificationManager.getUserNotifications('current-user', 20));
    };

    notificationManager.on('notification:created', updateNotifications);
    notificationManager.on('notification:read', updateNotifications);

    updateNotifications();

    return () => {
      notificationManager.off('notification:created', updateNotifications);
      notificationManager.off('notification:read', updateNotifications);
    };
  }, [notificationManager]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      notificationManager?.markAsRead(notificationId);
    },
    [notificationManager],
  );

  return { unreadCount, notifications, markAsRead };
}

export function useConflicts(conflictResolver: any) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!conflictResolver) return;

    const updateConflicts = () => {
      setConflicts(conflictResolver.getPendingConflicts());
      setStats(conflictResolver.getConflictStats());
    };

    conflictResolver.on('conflict:detected', updateConflicts);
    conflictResolver.on('conflict:resolved', updateConflicts);

    updateConflicts();

    return () => {
      conflictResolver.off('conflict:detected', updateConflicts);
      conflictResolver.off('conflict:resolved', updateConflicts);
    };
  }, [conflictResolver]);

  const resolveConflict = useCallback(
    (conflictId: string, strategy: string, mergedValue?: any) => {
      conflictResolver?.resolveConflictManual(conflictId, mergedValue, 'current-user');
    },
    [conflictResolver],
  );

  return { conflicts, stats, resolveConflict };
}

export function useDebounce<T>(value: T, delayMs: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delayMs]);

  return debouncedValue;
}
