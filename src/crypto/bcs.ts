/**
 * Minimal BCS (Binary Canonical Serialization) serializer,
 * compatible with the Rust BCS encoding used by ekiden-core.
 */
export class Serializer {
	private buffer: number[] = [];

	serializeU8(value: number): void {
		this.buffer.push(value & 0xff);
	}

	serializeBool(value: boolean): void {
		this.serializeU8(value ? 1 : 0);
	}

	serializeU64(value: bigint | number): void {
		let v = BigInt(value);
		for (let i = 0; i < 8; i++) {
			this.buffer.push(Number(v & 0xffn));
			v >>= 8n;
		}
	}

	serializeU32AsUleb128(value: number): void {
		let v = value >>> 0;
		while (v >= 0x80) {
			this.buffer.push((v & 0x7f) | 0x80);
			v >>>= 7;
		}
		this.buffer.push(v);
	}

	serializeBytes(bytes: Uint8Array): void {
		this.serializeU32AsUleb128(bytes.length);
		for (const byte of bytes) {
			this.buffer.push(byte);
		}
	}

	serializeStr(value: string): void {
		this.serializeBytes(new TextEncoder().encode(value));
	}

	serializeOption<T extends string | boolean | bigint | number>(
		value: T | null | undefined
	): void {
		if (value === null || value === undefined) {
			this.serializeU8(0);
			return;
		}
		this.serializeU8(1);
		if (typeof value === "string") {
			this.serializeStr(value);
		} else if (typeof value === "boolean") {
			this.serializeBool(value);
		} else {
			this.serializeU64(value);
		}
	}

	toUint8Array(): Uint8Array {
		return Uint8Array.from(this.buffer);
	}
}

export class U64 {
	constructor(private readonly value: bigint) {}

	bcsToBytes(): Uint8Array {
		const serializer = new Serializer();
		serializer.serializeU64(this.value);
		return serializer.toUint8Array();
	}
}

export class Bool {
	constructor(private readonly value: boolean) {}

	bcsToBytes(): Uint8Array {
		const serializer = new Serializer();
		serializer.serializeBool(this.value);
		return serializer.toUint8Array();
	}
}
