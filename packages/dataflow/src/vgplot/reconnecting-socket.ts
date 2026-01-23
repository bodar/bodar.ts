/**
 * @module reconnecting-socket
 *
 * A socket connector that keeps the container alive by sending a beacon
 * when WebSocket traffic goes quiet.
 */
import {SocketConnector} from '@uwdata/vgplot';

export interface ReconnectingSocketOptions {
    uri?: string;
    /** Beacon timeout in ms - should be less than server's sleepAfter (default: 50000) */
    beaconTimeout?: number;
}

interface QueueItem {
    query: { type?: string; sql: string };
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}

export class ReconnectingSocketConnector extends SocketConnector {
    readonly events: EventTarget = new EventTarget();
    private beaconTimeout: number;
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private hadActivity = false;
    private wasClosed = false;

    constructor(options: ReconnectingSocketOptions = {}) {
        super(options);
        this.beaconTimeout = options.beaconTimeout ?? 50_000;

        // Override parent's close handler to support reconnection
        const self = this as unknown as {
            _connected: boolean;
            _request: QueueItem | null;
            _ws: WebSocket | null;
            _queue: QueueItem[];
            _events: Record<string, (event?: unknown) => void>;
            next(): void;
        };

        self._events.close = () => {
            console.log('Connection closed');
            this.events.dispatchEvent(new Event('disconnected'));
            const hadPendingWork = self._queue.length > 0 || self._request !== null;

            self._connected = false;
            self._ws = null;
            this.wasClosed = true;
            this.clearTimer();

            if (hadPendingWork) {
                // Re-queue the in-flight request at the front
                if (self._request) {
                    self._queue.unshift(self._request);
                    self._request = null;
                }
                // Reconnect immediately - queue is preserved
                this.init();
            }
            // If no pending work, stay disconnected (idle close is fine)
        };

        // Override open to dispatch reconnected BEFORE calling next()
        self._events.open = () => {
            console.log('Connection opened');
            self._connected = true;

            if (this.wasClosed) {
                // Dispatch synchronously so handlers can prepend setup queries
                this.events.dispatchEvent(new Event('reconnected'));
            }

            this.hadActivity = false;
            this.startTimer();

            // Start processing queue only if not already started by queryPriority()
            if (!self._request) {
                self.next();
            }
        };
    }

    init(): void {
        console.log('Connection init');
        super.init();

        const ws = (this as unknown as {_ws: WebSocket | null})._ws;
        if (!ws) return;

        // open and close are handled by overridden _events in constructor
        this.events.dispatchEvent(new Event('opening'));

        ws.addEventListener('message', () => {
            this.hadActivity = true;
        });

        ws.addEventListener('error', () => {
            console.log('Connection error');
        });
    }

    /**
     * Execute a query at the front of the queue (skipping pending queries).
     * Use this for setup queries that must run before other pending work.
     */
    queryPriority(request: { type: 'exec'; sql: string }): Promise<void>;
    queryPriority(request: { type?: 'arrow'; sql: string }): Promise<unknown>;
    queryPriority(request: { type: 'json'; sql: string }): Promise<Record<string, unknown>[]>;
    queryPriority(request: { type?: string; sql: string }): Promise<unknown> {
        const self = this as unknown as {
            _ws: WebSocket | null;
            _queue: QueueItem[];
            _connected: boolean;
            _request: QueueItem | null;
            next(): void;
        };

        return new Promise((resolve, reject) => {
            if (self._ws == null) this.init();
            self._queue.unshift({ query: request, resolve, reject });
            if (self._connected && !self._request) {
                self.next();
            }
        });
    }

    private startTimer(): void {
        this.clearTimer();
        this.timeoutId = setTimeout(() => this.onTimerFired(), this.beaconTimeout);
    }

    private clearTimer(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    private onTimerFired(): void {
        if (this.hadActivity) {
            this.sendBeacon();
            this.hadActivity = false;
            this.startTimer();
        }
        // No activity - let container sleep
    }

    private sendBeacon(): void {
        const uri = (this as unknown as {_uri?: string})._uri;
        if (uri) {
            const beaconUrl = uri.replace('wss://', 'https://').replace('ws://', 'http://');
            navigator.sendBeacon(beaconUrl);
        }
    }
}

export function reconnectingSocketConnector(options: ReconnectingSocketOptions = {}): ReconnectingSocketConnector {
    return new ReconnectingSocketConnector(options);
}
