import { BaseWebSocketClient } from "@/core/base";
import type { EkidenClientConfig } from "@/core/config";
import { ConfigurationError } from "@/core/errors";
import type {
	ChannelMap,
	KlineEventHandler,
	OrderbookEventHandler,
	TickerEventHandler,
	TradesEventHandler,
} from "@/types/websocket";

export class PublicStream {
	private ws: BaseWebSocketClient<string, ChannelMap>;

	constructor(config: EkidenClientConfig) {
		if (!config.wsURL) {
			throw new ConfigurationError("WebSocket URL is not configured");
		}
		this.ws = new BaseWebSocketClient(config.wsURL);
	}

	subscribeTicker(symbol: string, handler: TickerEventHandler): () => void {
		const topic = `ticker.${symbol}` as const;
		this.ws.subscribe(topic as any, handler as any);
		return () => this.ws.unsubscribe(topic as any, handler as any);
	}

	subscribeTrades(symbol: string, handler: TradesEventHandler): () => void {
		const topic = `trade.${symbol}` as const;
		this.ws.subscribe(topic as any, handler as any);
		return () => this.ws.unsubscribe(topic as any, handler as any);
	}

	subscribeOrderbook(symbol: string, depth: string, handler: OrderbookEventHandler): () => void {
		const topic = `orderbook.${depth}.${symbol}` as const;
		this.ws.subscribe(topic as any, handler as any);
		return () => this.ws.unsubscribe(topic as any, handler as any);
	}

	subscribeKline(symbol: string, interval: string, handler: KlineEventHandler): () => void {
		const topic = `kline.${interval}.${symbol}` as const;
		this.ws.subscribe(topic as any, handler as any);
		return () => this.ws.unsubscribe(topic as any, handler as any);
	}

	subscribeTopics(topics: string[], handler: (event: unknown) => void): () => void {
		this.ws.subscribe(topics as any, handler as any);
		return () => this.ws.unsubscribe(topics as any, handler as any);
	}

	subscribeHandlers(handlers: Partial<ChannelMap>): () => void {
		this.ws.subscribe(handlers as any);
		return () => this.ws.unsubscribe(handlers as any);
	}

	unsubscribeTopics(topics: string[], handler: (event: unknown) => void): void {
		this.ws.unsubscribe(topics as any, handler as any);
	}

	unsubscribeHandlers(handlers: Partial<ChannelMap>): void {
		this.ws.unsubscribe(handlers as any);
	}

	close(): void {
		this.ws.close();
	}
}
