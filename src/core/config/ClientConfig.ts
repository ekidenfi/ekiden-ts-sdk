import type { CantonConfig } from "@/modules/canton/types";

export interface EkidenClientConfig {
	baseURL: string;
	wsURL?: string;
	privateWSURL?: string;
	apiPrefix: string;
	contractAddress: string;
	/** Deployment-specific Canton settings; enables `client.canton` and `client.cantonRegistry` */
	canton?: CantonConfig;
}
