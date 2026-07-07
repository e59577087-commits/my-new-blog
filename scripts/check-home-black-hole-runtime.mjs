const endpoint = "http://127.0.0.1:9223/json/list";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectPage() {
  const tabs = await fetch(endpoint).then((response) => response.json());
  const tab = tabs.find((item) => item.type === "page" && item.url.includes("runtime-black-hole-check=1"))
    ?? tabs.find((item) => item.type === "page" && item.url.includes("127.0.0.1:4321"));
  if (!tab) throw new Error("Chrome DevTools page tab is missing");

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const next = ++id;
      pending.set(next, resolve);
      ws.send(JSON.stringify({ id: next, method, params }));
    });

  return { ws, send };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const { ws, send } = await connectPage();

await send("Runtime.evaluate", {
  expression: "window.location.href = 'http://127.0.0.1:4321/?runtime-black-hole-check=1'",
});
await wait(4200);

const enabled = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `(() => {
    const root = document.documentElement;
    const canvas = document.querySelector('[data-home-black-hole-canvas]');
    const gl = canvas.getContext('webgl2');
    const state = window.__blackHoleState;
    return {
      setting: root.dataset.homeBlackHole,
      rootExists: !!document.querySelector('[data-home-black-hole-root]'),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      hasWebgl: !!gl,
      active: Boolean(state && state.active),
      radius: state ? state.radius : 0,
      x: state ? state.x : 0,
      y: state ? state.y : 0,
      textureReady: Boolean(state && state.textureReady),
      warpCount: document.querySelectorAll('[data-black-hole-warp]').length,
      textWarpCount: document.querySelectorAll('[data-black-hole-text-warp]').length,
    };
  })()`,
});

if (enabled.result.exceptionDetails) {
  throw new Error(enabled.result.exceptionDetails.text || "enabled runtime evaluation failed");
}
const enabledState = enabled.result.result.value;
assert(enabledState.setting === "on", "black hole should default to on");
assert(enabledState.rootExists, "black hole root should exist");
assert(enabledState.canvasWidth > 0 && enabledState.canvasHeight > 0, "black hole canvas should have dimensions");
assert(enabledState.hasWebgl, "black hole canvas should use WebGL2");
assert(enabledState.active, "black hole state should be active");
assert(enabledState.radius > 0 && enabledState.radius <= 164, "black hole radius should be within configured bounds");
assert(enabledState.x > 0 && enabledState.y > 0, "black hole should report page-coordinate position");
assert(enabledState.textureReady, "black hole should upload a captured page texture");
assert(enabledState.warpCount > 0, "black hole should mark warpable content while enabled");
assert(enabledState.textWarpCount > 0, "black hole should mark text content for suction while enabled");

const disabled = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `(() => {
    document.documentElement.dataset.homeBlackHole = 'off';
    return new Promise((resolve) => {
      setTimeout(() => {
        const state = window.__blackHoleState;
        const latest = document.querySelector('.latest-region');
        resolve({
          active: Boolean(state && state.active),
          warpCount: document.querySelectorAll('[data-black-hole-warp]').length,
          textWarpCount: document.querySelectorAll('[data-black-hole-text-warp]').length,
          latestDisplay: latest ? getComputedStyle(latest).display : null,
        });
      }, 350);
    });
  })()`,
  awaitPromise: true,
});

if (disabled.result.exceptionDetails) {
  throw new Error(disabled.result.exceptionDetails.text || "disabled runtime evaluation failed");
}
const disabledState = disabled.result.result.value;
assert(disabledState.active === false, "black hole should become inactive after disabling");
assert(disabledState.warpCount === 0, "warp markers should be removed after disabling");
assert(disabledState.textWarpCount === 0, "text warp markers should be removed after disabling");
assert(disabledState.latestDisplay !== "none", "home content should remain visible after disabling");

ws.close();
console.log("home black hole runtime checks passed");
