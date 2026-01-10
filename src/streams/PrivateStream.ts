import { PrivateWebSocketClient } from "@/core/base";
import type { ChannelMap } from "@/types/websocket";

export class PrivateStream {
	private ws: PrivateWebSocketClient;

	constructor(url: string) {
		this.ws = new PrivateWebSocketClient(url);
	}

	setToken(token: string): void {
		this.ws.setToken(token);
	}

	async connect(): Promise<void> {
		return this.ws.connect();
	}

	subscribeOrder(handler: (data: any) => void): () => void {
		this.ws.subscribe("order", handler);
		return () => this.ws.unsubscribe("order", handler);
	}

	subscribePosition(handler: (data: any) => void): () => void {
		this.ws.subscribe("position", handler);
		return () => this.ws.unsubscribe("position", handler);
	}

	subscribeExecution(handler: (data: any) => void): () => void {
		this.ws.subscribe("execution", handler);
		return () => this.ws.unsubscribe("execution", handler);
	}

	subscribeAccountBalance(handler: (data: any) => void): () => void {
		this.ws.subscribe("account_balance", handler);
		return () => this.ws.unsubscribe("account_balance", handler);
	}

	subscribe(topics: string[], handler: (data: any) => void): void;
	subscribe(handlers: Partial<ChannelMap>): void;
	subscribe(arg1: any, arg2?: (data: any) => void): void {
		if (arg2 !== undefined) {
			this.ws.subscribe(arg1, arg2);
		} else {
			this.ws.subscribe(arg1);
		}
	}

	unsubscribe(topics: string[], handler: (data: any) => void): void;
	unsubscribe(handlers: Partial<ChannelMap>): void;
	unsubscribe(arg1: any, arg2?: (data: any) => void): void {
		if (arg2 !== undefined) {
			this.ws.unsubscribe(arg1, arg2);
		} else {
			this.ws.unsubscribe(arg1);
		}
	}

	close(): void {
		this.ws.close();
	}
}
