import { CommentItem, ReplyItem, Collaborator, UserProfile } from '../types';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private currentDocId: string | null = null;
  private currentUser: UserProfile | null = null;
  public isConnected: boolean = false;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { connected: true });

        // Start ping heartbeat
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        // Re-join document if was joined
        if (this.currentDocId && this.currentUser) {
          this.joinDocument(this.currentDocId, this.currentUser);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return;
          this.emit(data.type, data);
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.emit('connection_change', { connected: false });
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.emit('connection_change', { connected: false });
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2500);
  }

  public joinDocument(documentId: string, user: UserProfile) {
    this.currentDocId = documentId;
    this.currentUser = user;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'join_document',
          documentId,
          user: {
            id: user.id,
            name: user.name,
            color: user.color,
            avatar: user.avatar,
          },
        })
      );
    }
  }

  public sendPresence(currentPage: number, cursorX?: number, cursorY?: number) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'presence_update',
          currentPage,
          cursorX,
          cursorY,
        })
      );
    }
  }

  public createComment(comment: Partial<CommentItem>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'create_comment',
          comment,
        })
      );
    }
  }

  public createReply(documentId: string, reply: Partial<ReplyItem>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'create_reply',
          documentId,
          reply,
        })
      );
    }
  }

  public resolveComment(documentId: string, commentId: string, status: 'open' | 'resolved') {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'resolve_comment',
          documentId,
          commentId,
          status,
        })
      );
    }
  }

  public editComment(documentId: string, commentId: string, content: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'edit_comment',
          documentId,
          commentId,
          content,
        })
      );
    }
  }

  public deleteComment(documentId: string, commentId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'delete_comment',
          documentId,
          commentId,
        })
      );
    }
  }

  public deleteReply(documentId: string, commentId: string, replyId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: 'delete_reply',
          documentId,
          commentId,
          replyId,
        })
      );
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WS event handler '${event}':`, e);
        }
      });
    }
  }
}

export const wsService = new WebSocketService();
