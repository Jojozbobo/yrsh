gsap.registerPlugin(ScrollTrigger, CustomEase);

CustomEase.create("reveal-ease", "0.625, 0.05, 0, 1");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lenis = null;

if (!prefersReducedMotion && typeof Lenis !== "undefined") {
  lenis = new Lenis({
    lerp: 0.08,
    wheelMultiplier: 0.9,
    smoothWheel: true
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

initAnchorScrolling();
initHeaderBehavior();
initMarquees();
initMagneticButtons();
prepareAutoRevealTargets();
initRevealAnimations();
initFadeAnimations();
initGalleryPage();
initFaqInteractions();
initHeroTransition();
initParallaxCards();
initFooterWave();
drawSectionLines();
mountFooterLogo();
revealFooterLogo();

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

function initAnchorScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") {
        return;
      }

      const target = document.querySelector(targetId);
      if (!target) {
        return;
      }

      event.preventDefault();

      const header = document.querySelector(".site-header");
      const offset = header ? header.offsetHeight + 16 : 0;

      if (lenis) {
        lenis.scrollTo(target, {
          offset: -offset,
          duration: 1.2
        });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top,
          behavior: "smooth"
        });
      }
    });
  });
}

function initHeaderBehavior() {
  const header = document.querySelector(".site-header");
  if (!header || prefersReducedMotion) {
    return;
  }

  let lastScroll = 0;
  let hidden = false;

  const showHeader = () => {
    if (!hidden) {
      return;
    }
    hidden = false;
    gsap.to(header, {
      yPercent: 0,
      duration: 0.45,
      ease: "power3.out",
      overwrite: true
    });
  };

  const hideHeader = () => {
    if (hidden) {
      return;
    }
    hidden = true;
    gsap.to(header, {
      yPercent: -100,
      duration: 0.42,
      ease: "power2.out",
      overwrite: true
    });
  };

  const updateHeader = (currentScroll) => {
    const delta = currentScroll - lastScroll;

    if (currentScroll <= 20) {
      showHeader();
      lastScroll = currentScroll;
      return;
    }

    if (delta > 4 && currentScroll > 140) {
      hideHeader();
    } else if (delta < -4) {
      showHeader();
    }

    lastScroll = currentScroll;
  };

  if (lenis) {
    lenis.on("scroll", ({ scroll }) => {
      updateHeader(scroll);
    });
  } else {
    window.addEventListener("scroll", () => {
      updateHeader(window.scrollY);
    }, { passive: true });
  }
}

function initMarquees() {
  const marquees = document.querySelectorAll(".js-marquee");
  const tweens = [];

  const setupMarquees = () => {
    tweens.forEach((tween) => tween.kill());
    tweens.length = 0;

    marquees.forEach((marquee) => {
      const inner = marquee.querySelector(".marquee__inner");
      if (!inner) {
        return;
      }

      inner.querySelectorAll(".is-marquee-clone").forEach((clone) => clone.remove());

      const group = inner.querySelector(".marquee__group");
      if (!group) {
        return;
      }

      const direction = Number(marquee.dataset.direction || -1);
      const duration = Number(marquee.dataset.duration || 20);
      const groupWidth = group.getBoundingClientRect().width;
      if (!groupWidth) {
        return;
      }

      const marqueeWidth = marquee.getBoundingClientRect().width;
      const clonesNeeded = Math.max(1, Math.ceil(marqueeWidth / groupWidth));

      for (let index = 0; index < clonesNeeded; index += 1) {
        const clone = group.cloneNode(true);
        clone.classList.add("is-marquee-clone");
        inner.appendChild(clone);
      }

      const distance = groupWidth;
      const startX = direction > 0 ? -distance : 0;
      const endX = direction > 0 ? 0 : -distance;

      gsap.set(inner, {
        x: startX
      });

      const tween = gsap.to(inner, {
        x: endX,
        duration,
        ease: "none",
        repeat: -1
      });

      tweens.push(tween);
      marquee._marqueeTween = tween;

      if (marquee.dataset.pauseHover === "true" && marquee.dataset.hoverBound !== "true") {
        marquee.addEventListener("mouseenter", () => {
          if (marquee._marqueeTween) {
            marquee._marqueeTween.pause();
          }
        });
        marquee.addEventListener("mouseleave", () => {
          if (marquee._marqueeTween) {
            marquee._marqueeTween.resume();
          }
        });
        marquee.dataset.hoverBound = "true";
      }
    });
  };

  setupMarquees();
  window.addEventListener("load", setupMarquees, { once: true });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setupMarquees);
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setupMarquees, 150);
  });
}

function initMagneticButtons() {
  const magnets = document.querySelectorAll("[data-magnetic]");

  if (!magnets.length || prefersReducedMotion || window.matchMedia("(pointer: coarse)").matches) {
    return;
  }

  magnets.forEach((magnet) => {
    if (magnet.dataset.magneticBound === "true") {
      return;
    }

    magnet.dataset.magneticBound = "true";

    const inner = magnet.querySelector("[data-magnetic-inner]") || magnet;
    const [strengthRaw, innerRaw] = (magnet.dataset.magnetic || "").split(",");
    const strength = Number.parseFloat(strengthRaw || 28);
    const innerStrength = Number.parseFloat(innerRaw || strength * 0.5);

    const moveMagnet = (event) => {
      const bounds = magnet.getBoundingClientRect();
      const relX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const relY = (event.clientY - bounds.top) / bounds.height - 0.5;

      gsap.to(magnet, {
        x: relX * strength,
        y: relY * strength,
        duration: 0.85,
        ease: "power3.out",
        overwrite: true
      });

      if (inner !== magnet) {
        gsap.to(inner, {
          x: relX * innerStrength,
          y: relY * innerStrength,
          duration: 0.9,
          ease: "power3.out",
          overwrite: true
        });
      }
    };

    const resetMagnet = () => {
      gsap.to(magnet, {
        x: 0,
        y: 0,
        duration: 1.05,
        ease: "elastic.out(1, 0.42)",
        overwrite: true
      });

      if (inner !== magnet) {
        gsap.to(inner, {
          x: 0,
          y: 0,
          duration: 1.05,
          ease: "elastic.out(1, 0.42)",
          overwrite: true
        });
      }
    };

    magnet.addEventListener("mousemove", moveMagnet);
    magnet.addEventListener("mouseleave", resetMagnet);
    magnet.addEventListener("blur", resetMagnet);
  });
}

function prepareAutoRevealTargets() {
  const selectors = [
    ".hero-kicker",
    ".hero-copy",
    ".gallery-story__text",
    ".art-card__title",
    ".art-card__meta",
    ".price-old",
    ".price-sale",
    ".testimonial-card__quote",
    ".testimonial-card__meta span",
    ".testimonial-card__stat",
    ".testimonial-card__label",
    ".faq-item summary span",
    ".footer-label",
    ".footer-mail",
    ".footer-nav a",
    ".footer-social a"
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((target) => {
      if (target.dataset.revealPrepared === "true" || target.querySelector(".reveal-line")) {
        target.dataset.revealPrepared = "true";
        if (!target.hasAttribute("data-reveal")) {
          target.setAttribute("data-reveal", "auto");
        }
        return;
      }

      const html = target.innerHTML.trim();
      if (!html) {
        return;
      }

      const parts = html
        .split(/<br\s*\/?>/i)
        .map((part) => part.trim())
        .filter(Boolean);

      target.innerHTML = parts
        .map((part) => `<span class="reveal-line"><span class="reveal-line__inner">${part}</span></span>`)
        .join("");

      target.dataset.revealPrepared = "true";
      if (!target.hasAttribute("data-reveal")) {
        target.setAttribute("data-reveal", "auto");
      }
    });
  });
}

function initRevealAnimations() {
  const revealGroups = [...document.querySelectorAll("[data-reveal]")];
  const scopes = new Map();

  const getRevealScope = (element) => (
    element.closest(".hero-stage, .section-heading, .art-card, .gallery-story, .testimonial-card, .faq-intro, .faq-item, .footer-contact-copy, .footer-nav, .footer-social, .footer-bottom")
    || element.parentElement
  );

  revealGroups.forEach((group) => {
    const scope = getRevealScope(group);
    const key = scope || group;

    if (!scopes.has(key)) {
      scopes.set(key, []);
    }

    scopes.get(key).push(group);
  });

  if (prefersReducedMotion) {
    revealGroups.forEach((group) => {
      const lines = group.querySelectorAll(".reveal-line__inner");
      if (!lines.length) {
        return;
      }

      gsap.set(lines, {
        yPercent: 0,
        opacity: 1
      });
    });
    return;
  }

  revealGroups.forEach((group) => {
    const lines = group.querySelectorAll(".reveal-line__inner");
    if (!lines.length) {
      return;
    }

    const scope = getRevealScope(group);
    const siblings = scopes.get(scope || group) || [group];
    const order = siblings.indexOf(group);
    const isTitle = group.matches(".section-title, .hero-copy, .testimonial-card__stat");
    const baseDelay = Math.max(0, order) * 0.11;
    const trigger = scope || group;

    gsap.set(lines, {
      yPercent: 112,
      opacity: 0.01
    });

    gsap.to(lines, {
      yPercent: 0,
      opacity: 1,
      duration: isTitle ? 1.28 : 1.12,
      stagger: 0.12,
      delay: baseDelay,
      ease: "reveal-ease",
      scrollTrigger: {
        trigger,
        start: "top 87%",
        once: true
      }
    });
  });
}

function initFadeAnimations() {
  const fadeTargets = document.querySelectorAll("[data-fade]");

  if (prefersReducedMotion) {
    gsap.set(fadeTargets, {
      opacity: 1,
      y: 0
    });
    return;
  }

  fadeTargets.forEach((target) => {
    gsap.fromTo(target, {
      opacity: 0,
      y: 48
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: target,
        start: "top 86%",
        once: true
      }
    });
  });
}

function initGalleryPage() {
  const root = document.querySelector("[data-gallery-page]");

  if (!root) {
    return;
  }

  const viewport = root.querySelector(".gallery-carousel");
  const slides = Array.from(root.querySelectorAll(".gallery-slide"));
  const buyLink = root.querySelector("[data-gallery-buy]");
  const prevButton = root.querySelector('[data-gallery-nav="prev"]');
  const nextButton = root.querySelector('[data-gallery-nav="next"]');
  const formatField = root.querySelector('[data-gallery-field="format"]');
  const titleField = root.querySelector('[data-gallery-field="title"]');
  const oldPriceField = root.querySelector('[data-gallery-field="price-old"]');
  const salePriceField = root.querySelector('[data-gallery-field="price-sale"]');
  const countField = root.querySelector('[data-gallery-field="count"]');

  if (!viewport || !slides.length || !buyLink || !formatField || !titleField || !oldPriceField || !salePriceField || !countField) {
    return;
  }

  let activeIndex = Math.max(0, Math.min(slides.length - 1, Number.parseInt(root.dataset.initial || "0", 10)));
  let isAnimating = false;
  let resizeTimeout = null;

  const setSwapText = (field, text) => {
    const current = field.querySelector(".gallery-swap__current");
    if (current) {
      current.textContent = text;
    }
  };

  const swapMaskedText = (field, text, options = {}) => {
    const viewportEl = field.querySelector(".gallery-swap__viewport");
    const current = viewportEl ? viewportEl.querySelector(".gallery-swap__current") : null;

    if (!viewportEl || !current || current.textContent === text) {
      return;
    }

    if (prefersReducedMotion) {
      current.textContent = text;
      return;
    }

    const next = document.createElement("span");
    next.className = "gallery-swap__current";
    next.textContent = text;
    viewportEl.appendChild(next);

    gsap.set(next, {
      yPercent: 108,
      opacity: 0.2
    });

    gsap.timeline({
      defaults: {
        overwrite: true
      },
      onComplete: () => {
        current.remove();
      }
    })
      .to(current, {
        yPercent: -108,
        opacity: 0,
        duration: options.duration || 0.82,
        ease: "reveal-ease"
      }, 0)
      .to(next, {
        yPercent: 0,
        opacity: 1,
        duration: options.duration || 0.82,
        ease: "reveal-ease"
      }, options.offset || 0.04);
  };

  const formatCount = (index) => String(index + 1).padStart(2, "0");

  const updateCopy = (index, immediate = false) => {
    const slide = slides[index];
    const title = slide.dataset.title || "";
    const format = slide.dataset.format || "";
    const oldPrice = slide.dataset.priceOld || "";
    const salePrice = slide.dataset.priceSale || "";
    const link = slide.dataset.link || "mailto:bengokuart@gmail.com";

    if (immediate) {
      setSwapText(formatField, format);
      setSwapText(titleField, title);
      setSwapText(oldPriceField, oldPrice);
      setSwapText(salePriceField, salePrice);
      setSwapText(countField, formatCount(index));
    } else {
      swapMaskedText(formatField, format, { duration: 0.78, offset: 0.02 });
      swapMaskedText(titleField, title, { duration: 0.9, offset: 0.03 });
      swapMaskedText(oldPriceField, oldPrice, { duration: 0.74, offset: 0.02 });
      swapMaskedText(salePriceField, salePrice, { duration: 0.78, offset: 0.03 });
      swapMaskedText(countField, formatCount(index), { duration: 0.9, offset: 0.04 });
    }

    buyLink.href = link;
    buyLink.setAttribute("aria-label", `Acheter ${title}`);
  };

  const getRelativeIndex = (index) => {
    let delta = index - activeIndex;
    const threshold = Math.floor(slides.length / 2);

    if (delta > threshold) {
      delta -= slides.length;
    } else if (delta < -threshold) {
      delta += slides.length;
    }

    return delta;
  };

  const positionSlides = (immediate = false) => {
    const nearOffset = viewport.offsetWidth * 0.33;
    const farOffset = viewport.offsetWidth * 0.56;

    slides.forEach((slide, index) => {
      const relative = getRelativeIndex(index);
      let config = {
        x: 0,
        y: 0,
        scale: 1,
        rotateY: 0,
        opacity: 1,
        zIndex: 5,
        shade: 0.04
      };

      if (relative === -1) {
        config = {
          x: -nearOffset,
          y: 54,
          scale: 0.82,
          rotateY: 19,
          opacity: 0.96,
          zIndex: 3,
          shade: 0.42
        };
      } else if (relative === 1) {
        config = {
          x: nearOffset,
          y: 34,
          scale: 0.82,
          rotateY: -19,
          opacity: 0.96,
          zIndex: 3,
          shade: 0.46
        };
      } else if (relative < -1) {
        config = {
          x: -farOffset,
          y: 62,
          scale: 0.64,
          rotateY: 28,
          opacity: 0,
          zIndex: 1,
          shade: 0.68
        };
      } else if (relative > 1) {
        config = {
          x: farOffset,
          y: 62,
          scale: 0.64,
          rotateY: -28,
          opacity: 0,
          zIndex: 1,
          shade: 0.68
        };
      }

      const media = slide.querySelector(".gallery-slide__media");
      const shade = slide.querySelector(".gallery-slide__shade");
      const method = immediate ? gsap.set : gsap.to;

      slide.classList.toggle("is-active", relative === 0);
      slide.style.zIndex = String(config.zIndex);
      slide.style.pointerEvents = Math.abs(relative) <= 1 ? "auto" : "none";
      slide.setAttribute("aria-hidden", Math.abs(relative) <= 1 ? "false" : "true");
      slide.setAttribute("aria-current", relative === 0 ? "true" : "false");
      slide.tabIndex = Math.abs(relative) <= 1 ? 0 : -1;

      method(slide, {
        xPercent: -50,
        x: config.x,
        y: config.y,
        scale: config.scale,
        rotateY: config.rotateY,
        opacity: config.opacity,
        duration: 1.02,
        ease: "power3.inOut"
      });

      if (media) {
        method(media, {
          boxShadow: relative === 0
            ? "0 44px 84px rgba(0, 0, 0, 0.42)"
            : "0 18px 34px rgba(0, 0, 0, 0.16)",
          duration: 0.9,
          ease: "power2.out"
        });
      }

      if (shade) {
        method(shade, {
          opacity: config.shade,
          duration: 0.9,
          ease: "power2.out"
        });
      }
    });
  };

  const animateIntro = () => {
    if (prefersReducedMotion) {
      return;
    }

    const introTargets = [
      formatField.querySelector(".gallery-swap__current"),
      titleField.querySelector(".gallery-swap__current"),
      oldPriceField.querySelector(".gallery-swap__current"),
      salePriceField.querySelector(".gallery-swap__current"),
      countField.querySelector(".gallery-swap__current")
    ].filter(Boolean);

    gsap.set(introTargets, {
      yPercent: 108,
      opacity: 0
    });

    gsap.set(buyLink, {
      opacity: 0,
      y: 20
    });

    const introTl = gsap.timeline({ delay: 0.16 });
    introTl.to(introTargets, {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.09,
      ease: "reveal-ease"
    });

    introTl.to(buyLink, {
      opacity: 1,
      y: 0,
      duration: 0.82,
      ease: "power3.out"
    }, 0.18);
  };

  const goTo = (nextIndex) => {
    if (isAnimating || nextIndex === activeIndex) {
      return;
    }

    isAnimating = true;
    activeIndex = (nextIndex + slides.length) % slides.length;

    positionSlides();
    updateCopy(activeIndex);

    gsap.delayedCall(1.02, () => {
      isAnimating = false;
    });
  };

  slides.forEach((slide, index) => {
    slide.addEventListener("click", () => {
      goTo(index);
    });
  });

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      goTo(activeIndex - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      goTo(activeIndex + 1);
    });
  }

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  });

  updateCopy(activeIndex, true);
  positionSlides(true);
  animateIntro();

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      positionSlides(true);
    }, 80);
  });
}

function initFaqInteractions() {
  const faqItems = document.querySelectorAll(".faq-item");

  if (!faqItems.length) {
    return;
  }

  faqItems.forEach((item) => {
    const summary = item.querySelector("summary");
    const content = item.querySelector(".faq-item__content");

    if (!summary || !content) {
      return;
    }

    if (prefersReducedMotion) {
      gsap.set(content, {
        height: item.open ? "auto" : 0
      });
      return;
    }

    gsap.set(content, {
      height: item.open ? "auto" : 0,
      overflow: "hidden"
    });

    summary.addEventListener("click", (event) => {
      event.preventDefault();

      if (item.dataset.animating === "true") {
        return;
      }

      item.dataset.animating = "true";
      gsap.killTweensOf(content);

      if (item.open) {
        const currentHeight = content.offsetHeight;
        gsap.set(content, {
          height: currentHeight,
          overflow: "hidden"
        });

        gsap.to(content, {
          height: 0,
          duration: 0.4,
          ease: "power3.inOut",
          overwrite: true,
          onComplete: () => {
            item.open = false;
            item.dataset.animating = "false";
          }
        });

        return;
      }

      item.open = true;
      const targetHeight = content.scrollHeight;

      gsap.set(content, {
        height: 0,
        overflow: "hidden"
      });

      gsap.to(content, {
        height: targetHeight,
        duration: 0.48,
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          gsap.set(content, {
            height: "auto",
            overflow: "hidden"
          });
          item.dataset.animating = "false";
        }
      });
    });
  });
}

function initHeroTransition() {
  const heroShell = document.querySelector(".hero-shell");
  const heroStage = document.querySelector(".hero-stage");
  const heroLogo = document.querySelector(".hero-logo-wrap");
  const heroPaths = document.querySelectorAll(".hero-logo path");

  if (heroPaths.length) {
    if (prefersReducedMotion) {
      if (heroLogo) {
        gsap.set(heroLogo, {
          opacity: 1,
          y: 0,
          scale: 1
        });
      }

      gsap.set(heroPaths, {
        fillOpacity: 1,
        strokeWidth: 0,
        strokeDashoffset: 0
      });
    } else {
      heroPaths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          fillOpacity: 0,
          strokeDasharray: length,
          strokeDashoffset: length,
          strokeWidth: 10
        });
      });

      const logoTl = gsap.timeline({
        delay: 0.08
      });

      logoTl.fromTo(".hero-logo-wrap", {
        opacity: 0,
        y: 24,
        scale: 0.97
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        ease: "power3.out"
      });

      logoTl.to(heroPaths, {
        strokeDashoffset: 0,
        duration: 2,
        stagger: 0.08,
        ease: "power2.inOut"
      }, 0.05);

      logoTl.to(heroPaths, {
        fillOpacity: 1,
        duration: 0.6,
        stagger: 0.02,
        ease: "power2.out"
      }, 1.15);

      logoTl.to(heroPaths, {
        strokeWidth: 0,
        duration: 0.8,
        ease: "power2.out"
      }, 1.28);
    }
  }

  if (!heroShell || !heroStage || prefersReducedMotion) {
    return;
  }

  gsap.to(heroStage, {
    yPercent: -8,
    opacity: 0.08,
    scale: 0.965,
    ease: "none",
    scrollTrigger: {
      trigger: heroShell,
      start: "top top",
      end: "bottom bottom",
      scrub: true
    }
  });

  if (heroLogo) {
    gsap.to(heroLogo, {
      yPercent: -4,
      scale: 0.93,
      ease: "none",
      scrollTrigger: {
        trigger: heroShell,
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
  }
}

function initParallaxCards() {
  const cards = document.querySelectorAll("[data-parallax]");

  if (prefersReducedMotion) {
    return;
  }

  cards.forEach((card) => {
    const image = card.querySelector("img");
    const amount = Number(card.dataset.parallax || 0.12);

    if (!image) {
      return;
    }

    gsap.fromTo(image, {
      yPercent: -amount * 120
    }, {
      yPercent: amount * 120,
      ease: "none",
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });
}

function initFooterWave() {
  const footer = document.querySelector(".site-footer");
  const path = document.querySelector("#footer-bounce-path");

  if (!footer || !path) {
    return;
  }

  const state = { curve: 0 };
  const svgWidth = 2278;
  const svgHeight = 683;
  const leftControl = 464;
  const centerX = 1139;
  let waveTimeline = null;

  const renderWave = () => {
    const curve = state.curve.toFixed(2);
    path.setAttribute("d", `M0 -0.3 C0 -0.3, ${leftControl} ${curve}, ${centerX} ${curve} S${svgWidth} -0.3, ${svgWidth} -0.3 V${svgHeight} H0 V-0.3 Z`);
  };

  renderWave();

  if (prefersReducedMotion) {
    return;
  }

  const bounceWave = (velocity) => {
    const absVelocity = Math.abs(velocity);
    const direction = velocity >= 0 ? 1 : -1;
    const peak = gsap.utils.clamp(108, 212, absVelocity / 13);
    const rebound = peak * 0.34;
    const settle = peak * 0.1;

    if (waveTimeline) {
      waveTimeline.kill();
    }

    gsap.killTweensOf(state);

    waveTimeline = gsap.timeline({
      defaults: {
        overwrite: true
      },
      onUpdate: renderWave
    });

    waveTimeline.set(state, {
      curve: peak * direction
    });

    waveTimeline.to(state, {
      curve: -rebound * direction,
      duration: 0.7,
      ease: "power2.inOut"
    });

    waveTimeline.to(state, {
      curve: settle * direction,
      duration: 0.48,
      ease: "power2.out"
    });

    waveTimeline.to(state, {
      curve: 0,
      duration: 0.8,
      ease: "expo.out"
    });
  };

  ScrollTrigger.create({
    trigger: footer,
    start: "top bottom",
    onEnter: (self) => bounceWave(self.getVelocity()),
    onEnterBack: (self) => bounceWave(self.getVelocity())
  });
}

function drawSectionLines() {
  const lines = document.querySelectorAll("[data-draw-line] path");

  lines.forEach((line) => {
    const length = line.getTotalLength();
    gsap.set(line, {
      strokeDasharray: length,
      strokeDashoffset: length
    });

    if (prefersReducedMotion) {
      gsap.set(line, {
        strokeDashoffset: 0
      });
      return;
    }

    gsap.to(line, {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: line.closest("[data-draw-line]"),
        start: "top 88%",
        once: true
      }
    });
  });
}

function mountFooterLogo() {
  const slot = document.querySelector(".footer-logo-mark");
  const heroLogo = document.querySelector(".hero-logo");
  const footerWrap = document.querySelector(".footer-logo-wrap");

  if (!slot || !heroLogo || !footerWrap) {
    return;
  }

  const footerLogo = heroLogo.cloneNode(true);
  footerLogo.classList.remove("hero-logo");
  footerLogo.classList.add("footer-logo");
  footerLogo.setAttribute("aria-hidden", "true");
  footerLogo.removeAttribute("aria-label");
  footerLogo.removeAttribute("role");

  slot.replaceChildren(footerLogo);
  footerWrap.classList.add("is-enhanced");
}

function revealFooterLogo() {
  const footerMark = document.querySelector(".footer-logo-mark");
  const footerLogo = document.querySelector(".footer-logo");
  const footerPaths = footerLogo ? footerLogo.querySelectorAll("path") : [];

  if (!footerMark || !footerLogo || !footerPaths.length) {
    return;
  }

  if (prefersReducedMotion) {
    gsap.set(footerMark, {
      opacity: 1,
      y: 0,
      scale: 1
    });
    gsap.set(footerPaths, {
      fillOpacity: 1,
      strokeWidth: 0,
      strokeDashoffset: 0
    });
    return;
  }

  footerPaths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, {
      fillOpacity: 0,
      strokeDasharray: length,
      strokeDashoffset: length,
      strokeWidth: 10
    });
  });

  const footerTl = gsap.timeline({
    scrollTrigger: {
      trigger: footerMark,
      start: "top 88%",
      once: true
    }
  });

  footerTl.fromTo(footerMark, {
    opacity: 0,
    y: 28,
    scale: 0.985
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.85,
    ease: "power3.out"
  });

  footerTl.to(footerPaths, {
    strokeDashoffset: 0,
    duration: 2,
    stagger: 0.08,
    ease: "power2.inOut"
  }, 0.06);

  footerTl.to(footerPaths, {
    fillOpacity: 1,
    duration: 0.6,
    stagger: 0.02,
    ease: "power2.out"
  }, 1.16);

  footerTl.to(footerPaths, {
    strokeWidth: 0,
    duration: 0.8,
    ease: "power2.out"
  }, 1.28);
}
