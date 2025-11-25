export const addressToBytes = (address: any): Uint8Array => {
  if (address instanceof Uint8Array) {
    return address;
  }

  if (typeof address === "string") {
    let hex = address.startsWith("0x") ? address.slice(2) : address;
    if (hex.length < 64) {
      hex = hex.padStart(64, "0");
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  if (typeof address?.toUint8Array === "function") {
    return address.toUint8Array();
  }

  throw new Error("Unknown address format");
};
