import type { CantonCommandBatch, CantonSubmitResponse } from "./types";

export interface SubmitCantonCommandsParams {
	/** Validator command submission endpoint URL */
	url: string;
	/** Bearer token for the validator (e.g. OIDC access token) */
	accessToken: string;
	batch: CantonCommandBatch;
}

/** Submit a command batch to a Canton validator */
export const submitCantonCommands = async ({
	url,
	accessToken,
	batch,
}: SubmitCantonCommandsParams): Promise<CantonSubmitResponse> => {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify(batch),
	});

	const payload = (await response.json()) as CantonSubmitResponse;
	if (!response.ok) {
		throw new Error(
			payload.message ||
				payload.error ||
				`Canton command submission failed (${response.status})`
		);
	}
	if (payload.error) {
		throw new Error(payload.message || payload.error);
	}
	return payload;
};
