(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = [...document.querySelectorAll('[data-reveal]')];

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const progressBar = document.querySelector('.reading-progress span');
  const nav = document.querySelector('.case-nav');
  const navLinks = [...document.querySelectorAll('.case-nav a')];
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;

    const activationLine = window.scrollY + window.innerHeight * 0.36;
    let current = navSections[0];
    navSections.forEach((section) => {
      if (section.offsetTop <= activationLine) current = section;
    });

    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${current.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateScrollUI();

  let scrollAnimation = 0;

  const scrollToSection = (target, hash) => {
    window.cancelAnimationFrame(scrollAnimation);
    const navOffset = nav?.offsetHeight || 0;
    const start = window.scrollY;
    const end = Math.max(0, target.getBoundingClientRect().top + start - navOffset);
    const distance = end - start;

    if (reducedMotion || Math.abs(distance) < 2) {
      window.scrollTo(0, end);
      window.history.pushState(null, '', hash);
      return;
    }

    const duration = 620;
    const startedAt = performance.now();
    const easeOut = (value) => 1 - Math.pow(1 - value, 4);

    const step = (now) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      window.scrollTo(0, start + distance * easeOut(elapsed));
      if (elapsed < 1) scrollAnimation = window.requestAnimationFrame(step);
      else window.history.pushState(null, '', hash);
    };

    scrollAnimation = window.requestAnimationFrame(step);
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      scrollToSection(target, hash);
      if (link.closest('.case-nav')) {
        link.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  });

  const processScroller = document.querySelector('.process-scroller');
  const processSteps = [...document.querySelectorAll('[data-process-step]')];

  const updateProcessStep = () => {
    if (!processScroller || !processSteps.length) return;
    const center = processScroller.scrollLeft + processScroller.clientWidth / 2;
    let closest = processSteps[0];
    let distance = Infinity;

    processSteps.forEach((step) => {
      const stepCenter = step.offsetLeft + step.offsetWidth / 2;
      const nextDistance = Math.abs(stepCenter - center);
      if (nextDistance < distance) {
        closest = step;
        distance = nextDistance;
      }
    });

    processSteps.forEach((step) => step.classList.toggle('is-active', step === closest));
  };

  if (processScroller) {
    processScroller.addEventListener('scroll', updateProcessStep, { passive: true });
    window.addEventListener('resize', updateProcessStep);
    updateProcessStep();
  }

  const annotations = [...document.querySelectorAll('.annotation')];
  annotations.forEach((annotation) => {
    annotation.addEventListener('click', () => {
      const willOpen = annotation.getAttribute('aria-expanded') !== 'true';
      annotations.forEach((item) => item.setAttribute('aria-expanded', 'false'));
      annotation.setAttribute('aria-expanded', String(willOpen));
    });
  });

  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCaption = lightbox?.querySelector('figcaption');
  const lightboxClose = lightbox?.querySelector('.lightbox__close');
  let lightboxTrigger = null;

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
  };

  document.querySelectorAll('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (!lightbox || !lightboxImage || !lightboxCaption) return;
      lightboxTrigger = trigger;
      const sourceImage = trigger.querySelector('img');
      lightboxImage.src = trigger.dataset.lightbox;
      lightboxImage.alt = trigger.dataset.caption || 'Expanded Normax interface';
      lightboxImage.width = Number(sourceImage?.getAttribute('width')) || 1400;
      lightboxImage.height = Number(sourceImage?.getAttribute('height')) || 893;
      lightboxCaption.textContent = trigger.dataset.caption || '';
      lightbox.showModal();
      lightboxClose?.focus();
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
    lightboxTrigger?.focus();
  });

  if (nav) {
    const navHeight = nav.offsetHeight;
    document.documentElement.style.setProperty('--case-nav-height', `${navHeight}px`);
  }

  if (window.location.hash) {
    const initialTarget = document.querySelector(window.location.hash);
    document.fonts.ready.then(() => {
      if (!initialTarget) return;
      window.requestAnimationFrame(() => {
        const navOffset = nav?.offsetHeight || 0;
        const top = initialTarget.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo(0, Math.max(0, top));
        updateScrollUI();
      });
    });
  }
})();
