import assert from "node:assert/strict";
import { textPdf } from "../src/lib/pdf";
import { bunkForecast, rotatingPass, takeToken, verifyRotatingPass } from "../src/lib/pure";
import { CampusStore } from "../src/lib/store";
import { DEMO_PASSWORD, ID } from "../src/lib/ids";

const safe = bunkForecast(70, 80);
assert.equal(safe.status, "SAFE");
assert.equal(safe.canMiss, 13);

const short = bunkForecast(50, 80);
assert.equal(short.status, "SHORT");
assert.equal(short.mustAttend, 40);
assert.equal(bunkForecast(50 + 40, 80 + 40).percent, 75);

const pass = rotatingPass(ID.ananya, "secret", 1_000_000);
assert.equal(verifyRotatingPass(pass.token, "secret", 1_000_000), true);
assert.equal(verifyRotatingPass(pass.token, "secret", 1_000_000 + 120_000), false);

const bucket = takeToken({ tokens: 1, updatedAt: 0 }, 0);
assert.equal(bucket.ok, true);
const empty = takeToken({ tokens: 0, updatedAt: 0 }, 0);
assert.equal(empty.ok, false);

const store = new CampusStore();
const ananya = store.users.find((row) => row.id === ID.ananya)!;
assert.equal(store.verifyPassword(ananya, DEMO_PASSWORD), true);
assert.throws(() => store.assertCanReadStudent({ id: ID.ananya, role: "STUDENT" }, ID.rohan));

store.issueOtp(ID.ananya, "payment", "482913");
assert.equal(store.consumeOtp(ID.ananya, "payment", "482913"), true);
const first = store.beginCheckout(ID.ananya, "inv-exam-21cse0142", "key-1");
const second = store.beginCheckout(ID.ananya, "inv-exam-21cse0142", "key-1");
assert.equal(first.txnId, second.txnId);
assert.equal(second.reused, true);
const settled = store.enqueueSettlement({ txnId: first.txnId, gatewayRef: first.gatewayRef, method: "UPI" });
assert.equal(store.invoices.find((row) => row.invoiceId === "inv-exam-21cse0142")?.status, "PENDING");
store.drainSettlements();
const replay = store.enqueueSettlement({ txnId: first.txnId, gatewayRef: first.gatewayRef, method: "UPI" });
assert.equal(settled.duplicate, false);
assert.equal(replay.duplicate, true);
assert.equal(store.invoices.find((row) => row.invoiceId === "inv-exam-21cse0142")?.status, "PAID");

const pdf = textPdf(["Helios", "Receipt"]);
assert.equal(Buffer.from(pdf.subarray(0, 5)).toString(), "%PDF-");
const approved = store.approvePass("pass-1", "APPROVED");
assert.ok(approved?.scanToken);
const scanned = store.scanPass(approved!.scanToken || "");
assert.equal(scanned.ok, true);
const again = store.scanPass(approved!.scanToken || "");
assert.equal(again.ok, false);
if (!again.ok) assert.equal(again.status, 409);

console.log("domain checks passed");
