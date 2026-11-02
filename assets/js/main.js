// Aldahir Labs — interacciones ligeras, sin dependencias.
(() => {
  // El <head> agrega html.motion antes de pintar; esto confirma que el script cargó.
  window.__alMotion = true;
  const motion = document.documentElement.classList.contains("motion");
  const root = document.documentElement;

  // Tema claro / oscuro: sigue al sistema hasta que la persona elige uno con el botón
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeToggles = document.querySelectorAll("[data-theme-toggle]");
  const systemLight = window.matchMedia("(prefers-color-scheme: light)");
  const storedTheme = () => {
    try {
      return localStorage.getItem("al-theme");
    } catch {
      return null;
    }
  };
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeMeta?.setAttribute("content", theme === "light" ? "#f7f7f8" : "#0b0b0d");
    themeToggles.forEach((btn) =>
      btn.setAttribute("aria-label", theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro")
    );
    document.dispatchEvent(new CustomEvent("themechange"));
  };
  applyTheme(root.dataset.theme === "light" ? "light" : "dark");
  themeToggles.forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem("al-theme", next);
      } catch {}
      if (motion && document.startViewTransition) document.startViewTransition(() => applyTheme(next));
      else applyTheme(next);
    })
  );
  systemLight.addEventListener("change", (e) => {
    if (!storedTheme()) applyTheme(e.matches ? "light" : "dark");
  });

  // Navbar: fondo al hacer scroll
  const nav = document.getElementById("nav");
  const onScroll = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Menú móvil
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    const icon = toggle.querySelector("use");
    const base = icon.getAttribute("href").split("#")[0];
    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      icon.setAttribute("href", `${base}#${open ? "x" : "menu"}`);
      document.body.style.overflow = open ? "hidden" : "";
      nav.classList.toggle("is-scrolled", open || window.scrollY > 12);
    };
    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => e.matches && setOpen(false));
  }

  // Enlace activo según la sección visible (navbar y índice de los casos de estudio)
  const links = document.querySelectorAll(".nav-links a[href^='#'], .cs-toc a[href^='#']");
  const sections = [...links].map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // Marca: destello al cargar y cada 9 s mientras se está arriba de la página
  const brand = document.querySelector(".brand");
  if (motion && brand) {
    const shine = () => {
      brand.classList.remove("is-shining");
      void brand.offsetWidth;
      brand.classList.add("is-shining");
    };
    brand.addEventListener("animationend", (e) => {
      if (e.animationName === "brand-glint") brand.classList.remove("is-shining");
    });
    setTimeout(shine, 1200);
    setInterval(() => {
      if (!document.hidden && window.scrollY < window.innerHeight * 0.5) shine();
    }, 9000);
  }

  // Revelado al hacer scroll
  if (motion && "IntersectionObserver" in window) {
    // Índice para las cascadas (listas, stack, capas)
    document.querySelectorAll('[data-reveal="list"], [data-reveal="layers"]').forEach((list) =>
      [...list.children].forEach((child, i) => child.style.setProperty("--i", i))
    );
    document.querySelectorAll('[data-reveal="stack"]').forEach((row) =>
      row.querySelectorAll("li").forEach((li, i) => li.style.setProperty("--i", i))
    );

    // Los títulos empiezan recortados (área visible cero), así que se observa su contenedor
    const targets = new Map();
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        targets.get(entry.target).forEach((el) => el.classList.add("in"));
        reveal.unobserve(entry.target);
      }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const target = el.dataset.reveal === "title" ? el.parentElement : el;
      if (!targets.has(target)) {
        targets.set(target, []);
        reveal.observe(target);
      }
      targets.get(target).push(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in"));
  }

  // Frase de "Sobre mí": una etiqueta por palabra para iluminarlas al leer
  const quote = document.querySelector(".principle p");
  const words = [];
  if (motion && quote) {
    const text = quote.textContent.trim();
    const parts = text.split(/\s+/);
    const readable = document.createElement("span");
    readable.className = "sr-only";
    readable.textContent = text;
    quote.textContent = "";
    quote.append(readable);
    parts.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.setAttribute("aria-hidden", "true");
      span.textContent = word;
      quote.append(span, i < parts.length - 1 ? " " : "");
      words.push(span);
    });
  }

  // Efectos ligados al scroll: línea de la trayectoria, frase y progreso de lectura
  const timeline = document.querySelector(".timeline");
  const tlItems = timeline ? [...timeline.querySelectorAll(".tl-item")] : [];
  const readBar = document.querySelector(".read-progress");
  const clamp = (v) => Math.min(1, Math.max(0, v));
  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    if (motion && timeline) {
      const r = timeline.getBoundingClientRect();
      const line = vh * 0.6;
      timeline.style.setProperty("--p", clamp((line - r.top) / r.height).toFixed(4));
      tlItems.forEach((item) => item.classList.toggle("is-reached", item.getBoundingClientRect().top + 44 < line));
    }

    if (words.length) {
      const r = quote.getBoundingClientRect();
      const progress = clamp((vh * 0.88 - r.top) / (vh * 0.4));
      const lit = Math.round(progress * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    }

    if (readBar) {
      const max = document.documentElement.scrollHeight - vh;
      readBar.style.setProperty("--read", max > 0 ? clamp(window.scrollY / max).toFixed(4) : 0);
    }
  };
  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  if ((motion && (timeline || words.length)) || readBar) {
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
  }

  // Redes de nodos de fondo (hero y contacto): se conectan entre sí y se acercan al cursor.
  // Cada una corre solo mientras su sección está a la vista; con "reducir movimiento" se dibuja quieta.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const createNet = (host, net) => {
    if (!net.getContext) return;
    const ctx = net.getContext("2d");
    const LINK = 130;
    const REACH = 190;
    const pointer = { x: 0, y: 0, active: false };
    // Colores desde los tokens del tema (--net-line, --net-hot)
    let lineRGB = "161, 161, 170";
    let hotRGB = "56, 189, 248";
    const readColors = () => {
      const css = getComputedStyle(root);
      lineRGB = css.getPropertyValue("--net-line").trim() || lineRGB;
      hotRGB = css.getPropertyValue("--net-hot").trim() || hotRGB;
    };
    readColors();
    let w = 0;
    let h = 0;
    let nodes = [];
    let raf = 0;
    let running = false;
    let inView = true;

    const setup = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      net.width = Math.round(w * dpr);
      net.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(finePointer ? 70 : 32, (w * h) / 15000));
      nodes = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.12 + Math.random() * 0.18;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        return { x: Math.random() * w, y: Math.random() * h, vx, vy, bx: vx, by: vy, r: 1 + Math.random() * 1.2 };
      });
    };

    const move = () => {
      for (const n of nodes) {
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const d = Math.hypot(dx, dy);
          // Atracción suave hacia el cursor, sin amontonarse encima
          if (d < REACH && d > 28) {
            const f = (1 - d / REACH) * 0.035;
            n.vx += (dx / d) * f;
            n.vy += (dy / d) * f;
          }
        }
        // Vuelve poco a poco a su deriva original
        n.vx += (n.bx - n.vx) * 0.02;
        n.vy += (n.by - n.vy) * 0.02;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        else if (n.y > h + 20) n.y = -20;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(${lineRGB}, ${((1 - Math.sqrt(d2) / LINK) * 0.22).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        let near = 0;
        if (pointer.active) {
          const d = Math.hypot(pointer.x - n.x, pointer.y - n.y);
          if (d < REACH) {
            near = 1 - d / REACH;
            ctx.strokeStyle = `rgba(${hotRGB}, ${(near * 0.5).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = near > 0 ? `rgba(${hotRGB}, ${(0.45 + near * 0.55).toFixed(3)})` : `rgba(${lineRGB}, 0.6)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + near * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = () => {
      move();
      draw();
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const run = motion && inView && !document.hidden;
      if (run && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!run && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    setup();
    draw();
    requestAnimationFrame(() => net.classList.add("is-ready"));
    document.addEventListener("themechange", () => {
      readColors();
      if (!running) draw();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        sync();
      }).observe(host);
    } else {
      sync();
    }
    document.addEventListener("visibilitychange", sync);

    let resizeTimer;
    let lastSize = `${host.clientWidth}x${host.clientHeight}`;
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const size = `${host.clientWidth}x${host.clientHeight}`;
        if (size === lastSize) return;
        lastSize = size;
        setup();
        draw();
      }, 200);
    };
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener("resize", resize);

    if (motion && finePointer) {
      let clientX = 0;
      let clientY = 0;
      const locate = () => {
        const r = host.getBoundingClientRect();
        pointer.x = clientX - r.left;
        pointer.y = clientY - r.top;
      };
      host.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        clientX = e.clientX;
        clientY = e.clientY;
        pointer.active = true;
        locate();
      });
      host.addEventListener("pointerleave", () => (pointer.active = false));
      // Si la página se desplaza con el cursor quieto, el punto sigue en su lugar real
      window.addEventListener("scroll", () => pointer.active && locate(), { passive: true });
    }
  };
  document.querySelectorAll(".node-net").forEach((net) => createNet(net.parentElement, net));

  // Frase rotativa del hero: corre solo mientras se ve y la pestaña está activa
  const rotator = document.querySelector(".rotator");
  if (motion && rotator && "IntersectionObserver" in window) {
    const items = [...rotator.children];
    let current = 0;
    let timer = null;
    let inView = false;
    // En pantallas donde la frase cabe en una línea, el ancho sigue a la frase actual
    // para que no quede un hueco antes de "que"; en móvil se reserva el de la más larga.
    const wide = window.matchMedia("(min-width: 561px)");
    const fit = () => {
      if (wide.matches) {
        rotator.classList.add("is-sized");
        rotator.style.width = `${items[current].getBoundingClientRect().width}px`;
      } else {
        rotator.classList.remove("is-sized");
        rotator.style.width = "";
      }
    };
    const HOLD = 2600;
    rotator.style.setProperty("--rot-hold", `${HOLD}ms`);
    // Reinicia la línea del temporizador en cada frase
    const restartTimer = () => {
      rotator.classList.remove("is-timing");
      void rotator.offsetWidth;
      rotator.classList.add("is-timing");
    };
    const step = () => {
      const leaving = items[current];
      current = (current + 1) % items.length;
      leaving.classList.replace("is-current", "is-leaving");
      items[current].classList.add("is-current");
      fit();
      restartTimer();
      setTimeout(() => leaving.classList.remove("is-leaving"), 800);
    };
    fit();
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    const sync = () => {
      const run = inView && !document.hidden;
      if (run && !timer) {
        timer = setInterval(step, HOLD);
        restartTimer();
      }
      if (!run && timer) {
        clearInterval(timer);
        timer = null;
        rotator.classList.remove("is-timing");
      }
    };
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }).observe(rotator);
    document.addEventListener("visibilitychange", sync);
  }

  // Copiar correo
  const copyBtn = document.getElementById("copyEmail");
  if (copyBtn) {
    const label = copyBtn.querySelector("span");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.email);
        copyBtn.classList.add("is-copied");
        label.textContent = "¡Copiado!";
        setTimeout(() => {
          copyBtn.classList.remove("is-copied");
          label.textContent = "Copiar correo";
        }, 2000);
      } catch {
        window.location.href = `mailto:${copyBtn.dataset.email}`;
      }
    });
  }

  // Año del footer
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
