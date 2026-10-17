import { afterEach, expect, test, vi } from "bun:test";
import { CantonCommands } from "../src/modules/canton/commands";
import { CantonRegistryClient } from "../src/modules/canton/registry";
import type { CantonConfig } from "../src/modules/canton/types";

const USER = "alice::1220aa";
const config = {
	packageId: "pkg",
	packageName: "#ekiden",
	userContractCid: "00user",
	userContractEventBlob: "u",
	synchronizerId: "sync::1",
	instrumentAdmin: "usdcx-admin::1220",
	instrumentId: "USDCx",
	utilityRegistryBaseUrl:
		"https://registry.test/api/token-standard/v0/registrars/usdcx-admin%3A%3A1220",
} as CantonConfig;

const rejectContext = {
	extraArgs: { context: { values: { lock: "00lock" } }, meta: { values: {} } },
	disclosedContracts: [
		{
			templateId: "reg:Rules",
			contractId: "00rules",
			createdEventBlob: "r",
			synchronizerId: "sync::1",
		},
	],
};

afterEach(() => {
	vi.restoreAllMocks();
});

test("cancelPendingWithdrawal exercises CancelPendingWithdrawal with the reject context", () => {
	const batch = new CantonCommands(config).cancelPendingWithdrawal({
		partyId: USER,
		pendingWithdrawalCid: "00record",
		fundingVaultCid: "00vault",
		rejectContext,
	});

	const [command] = batch.commands;
	expect("ExerciseCommand" in command && command.ExerciseCommand).toMatchObject({
		contractId: "00user",
		choice: "CancelPendingWithdrawal",
		choiceArgument: {
			user: USER,
			pendingWithdrawal: "00record",
			fundingVault: "00vault",
			extraArgs: rejectContext.extraArgs,
		},
	});
	expect(batch.disclosedContracts?.map((contract) => contract.contractId)).toEqual([
		"00user",
		"00rules",
	]);
});

test("fetchTransferInstructionChoiceContext asks the instrument admin's registrar", async () => {
	const fetchMock = vi
		.spyOn(globalThis, "fetch")
		.mockResolvedValue(
			new Response(
				JSON.stringify({ choiceContextData: { values: { a: 1 } }, disclosedContracts: [] })
			)
		);

	const context = await new CantonRegistryClient(config).fetchTransferInstructionChoiceContext(
		"ember-gold::1220",
		"00instruction",
		"accept"
	);

	expect(String(fetchMock.mock.calls[0][0])).toBe(
		"https://registry.test/api/token-standard/v0/registrars/ember-gold%3A%3A1220/registry/transfer-instruction/v1/00instruction/choice-contexts/accept"
	);
	expect(context.extraArgs.context.values).toEqual({ a: 1 });
});

test("acceptTransferInstruction exercises TransferInstruction_Accept", () => {
	const batch = new CantonCommands(config).acceptTransferInstruction({
		partyId: USER,
		contractId: "00instruction",
		acceptContext: rejectContext,
	});

	const [command] = batch.commands;
	expect("ExerciseCommand" in command && command.ExerciseCommand.choice).toBe(
		"TransferInstruction_Accept"
	);
});
