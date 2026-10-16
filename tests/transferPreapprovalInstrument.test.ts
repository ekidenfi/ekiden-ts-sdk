import { expect, test } from "bun:test";
import { CantonCommands } from "../src/modules/canton/commands";
import {
	findTransferPreapprovalInContracts,
	transferPreapprovalCoversInstrument,
} from "../src/modules/canton/contracts";
import type { CantonConfig } from "../src/modules/canton/types";

const USER = "alice::1220aa";
const USDCX = { admin: "decentralized-usdc-interchain-rep::1220bb", id: "USDCx" };
const EXAU = { admin: "ember-gold::1220ad", id: "eXAU" };

const flatPreapproval = (contractId: string, instrumentAdmin: string, ids: string[]) => ({
	createdEvent: {
		contractId,
		createdEventBlob: `blob-${contractId}`,
		createArgument: {
			operator: "DigitalAsset-UtilityOperator::1220",
			receiver: USER,
			instrumentAdmin,
			instrumentAllowances: ids.map((id) => ({ id })),
		},
	},
});

const fieldsPreapproval = (contractId: string, instrumentAdmin: string, id: string) => ({
	createdEvent: {
		contractId,
		createdEventBlob: `blob-${contractId}`,
		createArgument: {
			fields: [
				{ label: "receiver", value: { party: USER } },
				{ label: "instrumentAdmin", value: { party: instrumentAdmin } },
				{
					label: "instrumentAllowances",
					value: {
						list: {
							elements: [
								{ record: { fields: [{ label: "id", value: { text: id } }] } },
							],
						},
					},
				},
			],
		},
	},
});

test("findTransferPreapprovalInContracts picks the preapproval of the requested instrument", () => {
	const contracts = [
		flatPreapproval("00usdcx", USDCX.admin, ["USDCx"]),
		flatPreapproval("00gold", EXAU.admin, ["eXAU"]),
	];

	expect(findTransferPreapprovalInContracts(contracts, USER, EXAU)?.contractId).toBe("00gold");
	expect(findTransferPreapprovalInContracts(contracts, USER, USDCX)?.contractId).toBe("00usdcx");
	expect(findTransferPreapprovalInContracts(contracts, USER)?.contractId).toBe("00usdcx");
});

test("findTransferPreapprovalInContracts finds none when no preapproval covers the instrument", () => {
	const contracts = [flatPreapproval("00usdcx", USDCX.admin, ["USDCx"])];

	expect(findTransferPreapprovalInContracts(contracts, USER, EXAU)).toBeUndefined();
});

test("transferPreapprovalCoversInstrument reads the protobuf field encoding", () => {
	const { createArgument } = fieldsPreapproval("00gold", EXAU.admin, "eXAU").createdEvent;

	expect(transferPreapprovalCoversInstrument(createArgument, EXAU)).toBe(true);
	expect(
		transferPreapprovalCoversInstrument(createArgument, { admin: EXAU.admin, id: "eXAG" })
	).toBe(false);
	expect(transferPreapprovalCoversInstrument(createArgument, USDCX)).toBe(false);
});

test("createPreapproveTransfers creates the preapproval for the requested instrument", () => {
	const commands = new CantonCommands({
		instrumentAdmin: USDCX.admin,
		instrumentId: USDCX.id,
		quoteAssetOperator: "DigitalAsset-UtilityOperator::1220",
		transferPreapprovalTemplateId: "#utility-registry-app-v0:Model:TransferPreapproval",
		synchronizerId: "global-domain::1220",
	} as CantonConfig);

	const readArgs = (instrument?: typeof EXAU) => {
		const [command] = commands.createPreapproveTransfers({
			partyId: USER,
			instrument,
		}).commands;
		return "CreateCommand" in command ? command.CreateCommand.createArguments : undefined;
	};

	expect(readArgs(EXAU)).toMatchObject({
		instrumentAdmin: EXAU.admin,
		instrumentAllowances: [{ id: "eXAU" }],
	});
	expect(readArgs()).toMatchObject({
		instrumentAdmin: USDCX.admin,
		instrumentAllowances: [{ id: "USDCx" }],
	});
});
