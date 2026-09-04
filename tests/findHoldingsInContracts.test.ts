import { expect, test } from "bun:test";
import { findHoldingsInContracts } from "../src/modules/canton/contracts";
import fixture from "./fixtures/getContracts-holdings.json";

const PARTY_ID =
	"Ekiden-app-1::1220d14a2d1b0acbb260c1fee2382b3206390406fc86be5dfdf24dfa14bdbd1d54b4";

const CONTRACT_ID =
	"00970522954cc1ec20f4ffdf3eafffdc05632bc8708d9fcae4b18004aedb274d5fca121220a5ee10ea4231191e45981c582ec9f862bd7b6ff320e208ce3ed89cb7d376b15a";

const TEMPLATE_ID =
	"8107899ac4723ce986bf7d27416534e576e54b92161e46150a595fb78ff3d3a1:Utility.Registry.Holding.V0.Holding:Holding";

test("findHoldingsInContracts parses Daml fields from gateway getContracts Holding response", () => {
	const holdings = findHoldingsInContracts(
		fixture.contracts as Record<string, unknown>[],
		PARTY_ID
	);

	expect(holdings).toHaveLength(1);
	expect(holdings[0]).toEqual({
		contractId: CONTRACT_ID,
		amount: "1.0000000000",
		createdEventBlob: (
			fixture.contracts[0] as {
				createdEvent: { createdEventBlob: string };
			}
		).createdEvent.createdEventBlob,
		templateId: TEMPLATE_ID,
	});
});

test("findHoldingsInContracts skips holdings owned by another party", () => {
	const holdings = findHoldingsInContracts(
		fixture.contracts as Record<string, unknown>[],
		"Other-party::deadbeef"
	);

	expect(holdings).toEqual([]);
});

test("findHoldingsInContracts supports flat createArgument shape", () => {
	const holdings = findHoldingsInContracts(
		[
			{
				createdEvent: {
					contractId: "cid-flat",
					templateId: TEMPLATE_ID,
					createdEventBlob: "blob",
					createArgument: {
						owner: PARTY_ID,
						amount: "42.5",
					},
				},
			},
		],
		PARTY_ID
	);

	expect(holdings).toEqual([
		{
			contractId: "cid-flat",
			amount: "42.5",
			createdEventBlob: "blob",
			templateId: TEMPLATE_ID,
		},
	]);
});
