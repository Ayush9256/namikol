import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRazorpayScript } from "../src/utils/loadRazorpay.js";

function setup(t) {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const scripts = [];
  globalThis.window = {};
  globalThis.document = {
    querySelector: () => scripts.find((script) => !script.removed) || null,
    createElement: () => {
      const listeners = new Map();
      return {
        addEventListener(name, callback) { listeners.set(name, callback); },
        removeEventListener(name) { listeners.delete(name); },
        remove() { this.removed = true; },
        fire(name) { listeners.get(name)?.(); },
      };
    },
    body: { appendChild(script) { scripts.push(script); } },
  };
  t.after(() => {
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  });
  return scripts;
}

test("concurrent checkout attempts share one script and resolve when SDK loads", async (t) => {
  const scripts = setup(t);
  const first = loadRazorpayScript();
  const second = loadRazorpayScript();
  assert.equal(first, second);
  assert.equal(scripts.length, 1);
  globalThis.window.Razorpay = function Razorpay() {};
  scripts[0].fire("load");
  assert.equal(await first, true);
  assert.equal(await loadRazorpayScript(), true);
  assert.equal(scripts.length, 1);
});

test("failed checkout SDK load removes the script so a retry succeeds", async (t) => {
  const scripts = setup(t);
  const first = loadRazorpayScript();
  scripts[0].fire("error");
  assert.equal(await first, false);
  assert.equal(scripts[0].removed, true);
  const second = loadRazorpayScript();
  assert.equal(scripts.length, 2);
  globalThis.window.Razorpay = function Razorpay() {};
  scripts[1].fire("load");
  assert.equal(await second, true);
});

test("checkout SDK timeout resolves failure and allows a fresh attempt", async (t) => {
  const scripts = setup(t);
  let timeout;
  t.mock.method(globalThis, "setTimeout", (callback) => { timeout = callback; return 1; });
  t.mock.method(globalThis, "clearTimeout", () => {});
  const first = loadRazorpayScript();
  timeout();
  assert.equal(await first, false);
  assert.equal(scripts[0].removed, true);
});
