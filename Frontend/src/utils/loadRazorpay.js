let pending;

export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (pending) return pending;

  pending = new Promise((resolve) => {
    const src = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector(`script[src="${src}"]`);
    const script = existing || document.createElement("script");
    let timer;
    const finish = (success) => {
      clearTimeout(timer);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      if (!success) script.remove();
      resolve(success);
    };
    const loaded = () => finish(Boolean(window.Razorpay));
    const failed = () => finish(false);
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    timer = setTimeout(failed, 15000);
    if (!existing) {
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }
  }).finally(() => { pending = undefined; });
  return pending;
}
