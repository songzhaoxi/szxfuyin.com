(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  document.body.classList.add("fuyin-immersive-mode");
  document.body.insertAdjacentHTML("afterbegin", '<div class="fuyin-immersive-stage" aria-hidden="true"><span class="fuyin-orbit fuyin-orbit-one"></span><span class="fuyin-orbit fuyin-orbit-two"></span><span class="fuyin-light-track fuyin-track-one"></span><span class="fuyin-light-track fuyin-track-two"></span></div>');
  const stage = document.querySelector(".fuyin-immersive-stage");
  if (!stage || reduceMotion.matches || !finePointer.matches) return;
  let frame = 0;
  window.addEventListener("pointermove", event => {
    const x = (event.clientX / window.innerWidth - 0.5) * 12;
    const y = (event.clientY / window.innerHeight - 0.5) * 12;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => stage.style.setProperty("--fuyin-parallax", `${x}px ${y}px`));
  }, { passive: true });
})();
