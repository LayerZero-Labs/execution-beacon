import * as anchor from "@coral-xyz/anchor";
import { describe, it } from "mocha";
import { expect } from "chai";
import bs58 from "bs58";
import { createHash } from "crypto";

describe("execution-beacon e2e", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ExecutionBeacon;

  it("emits ExecutionObserved (emit_cpi)", async () => {
    const quoteId = new Uint8Array(32).fill(0xaa);

    const sig = await program.methods
      .emitExecution(Array.from(quoteId) as number[])
      .accounts({
        payer: provider.wallet.publicKey,
      })
      .rpc();

    const tx = await provider.connection.getParsedTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    expect(tx).to.not.be.null;
    expect(tx!.meta?.err).to.equal(null);

    const events = extractExecutionObservedEventsFromParsedTx(
      tx!,
      program.programId
    );

    expect(events).to.not.be.null;
    expect(events!.length).to.be.greaterThan(0);

    const ev = events![0];
    expect(ev.payer.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(Buffer.from(ev.quoteId).toString("hex")).to.equal(
      Buffer.from(quoteId).toString("hex")
    );
  });

  it("fails if payer is not a signer", async () => {
    const quoteId = new Uint8Array(32).fill(0xbb);
    const fakePayer = anchor.web3.Keypair.generate().publicKey;

    let threw = false;
    try {
      await program.methods
        .emitExecution(Array.from(quoteId) as number[])
        .accounts({ payer: fakePayer })
        .rpc();
    } catch {
      threw = true;
    }

    expect(threw).to.equal(true);
  });
});

// sha256("anchor:event")[0..8]
const EVENT_EMIT_DISCRIMINATOR = Buffer.from("e445a52e51cb9a1d", "hex");

// sha256("event:<EventName>")[0..8]
function eventDiscriminator(eventName: string): Buffer {
  return Buffer.from(
    createHash("sha256")
      .update(`event:${eventName}`)
      .digest()
      .subarray(0, 8)
  );
}

type ExecutionObservedDecoded = {
  payer: anchor.web3.PublicKey;
  quoteId: Uint8Array;
};

/**
 * Backend-style extraction:
 * - iterate meta.innerInstructions
 * - filter by inst.programId == our program id
 * - decode base58 instruction data
 * - verify [emit_cpi wrapper disc][event disc][borsh payload]
 * - parse payload (payer + quote_id)
 */
function extractExecutionObservedEventsFromParsedTx(
  tx: anchor.web3.ParsedTransactionWithMeta,
  programId: anchor.web3.PublicKey
): ExecutionObservedDecoded[] | null {
  const inner = tx.meta?.innerInstructions ?? [];
  if (!inner.length) return null;

  const expectedEventDisc = eventDiscriminator("ExecutionObserved");
  const events: ExecutionObservedDecoded[] = [];

  for (const innerIx of inner) {
    for (const innerInstruction of innerIx.instructions as any[]) {
      // parsed inner instructions in getParsedTransaction often include programId + data
      // we only care about PartiallyDecodedInstruction-like objects
      const instProgramId = innerInstruction?.programId;
      const instData = innerInstruction?.data;

      if (!instProgramId || !instData) continue;

      // Filter by program id (same as backend)
      const pid =
        instProgramId instanceof anchor.web3.PublicKey
          ? instProgramId
          : new anchor.web3.PublicKey(instProgramId);
      if (!pid.equals(programId)) continue;

      const raw = Buffer.from(bs58.decode(instData));
      if (raw.length < 16) continue;

      // [0..8] = anchor:event
      const emitDisc = raw.subarray(0, 8);
      if (!emitDisc.equals(EVENT_EMIT_DISCRIMINATOR)) continue;

      // [8..16] = event discriminator
      const evDisc = raw.subarray(8, 16);
      if (!evDisc.equals(expectedEventDisc)) continue;

      // payload starts at 16
      // For this event: payer (32) + quote_id (32) => 64 bytes
      if (raw.length !== 16 + 32 + 32) {
        throw new Error(`Unexpected ExecutionObserved length: ${raw.length}`);
      }

      const payer = new anchor.web3.PublicKey(raw.subarray(16, 48));
      const quoteId = Uint8Array.from(raw.subarray(48, 80));

      events.push({ payer, quoteId });
    }
  }

  return events.length ? events : null;
}