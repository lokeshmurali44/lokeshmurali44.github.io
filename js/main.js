/* Lokesh Murali portfolio: responsive navigation, booking and scroll choreography. */
(function () {
  'use strict';

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const snapMode = new URLSearchParams(location.search).has('snap');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || snapMode;
  const desktop = window.matchMedia('(min-width: 761px)');

  if (snapMode) document.documentElement.classList.add('is-snapshot');

  function initMenu() {
    const burger = qs('#navBurger');
    const menu = qs('#mobileMenu');
    if (!burger || !menu) return;
    const close = () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    };
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    qsa('a', menu).forEach((link) => link.addEventListener('click', close));
  }

  function initEmailCopy() {
    const button = qs('#copyEmail');
    const label = qs('#copyEmailText');
    if (!button || !label) return;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('lokeshmurali44@gmail.com');
        label.textContent = 'Email copied';
      } catch (_error) {
        location.href = 'mailto:lokeshmurali44@gmail.com';
      }
      window.setTimeout(() => { label.textContent = 'lokeshmurali44@gmail.com'; }, 1600);
    });
  }

  function initBooking() {
    const dialog = qs('#bookingDialog');
    const form = qs('#bookingForm');
    if (!dialog || !form) return;
    const date = qs('input[type="date"]', form);
    if (date) date.min = new Date().toISOString().split('T')[0];

    qsa('[data-booking]').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        dialog.showModal();
        document.body.classList.add('dialog-open');
      });
    });
    qs('[data-booking-close]', dialog)?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const subject = `Portfolio call request from ${data.get('name')}`;
      const body = [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Preferred date: ${data.get('date')}`,
        `Preferred time: ${data.get('time')}`,
        '',
        'Project summary:',
        data.get('brief'),
      ].join('\n');
      location.href = `mailto:lokeshmurali44@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      dialog.close();
    });
  }

  function initJourneyExpanders() {
    const returnPositions = new WeakMap();
    const scrollToPosition = (top) => {
      if (window.lenis) {
        window.lenis.scrollTo(top, { duration: 0.72, force: true });
      } else {
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    qsa('[data-more]').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.jcard');
        const extra = card ? qs('.jcard__extra', card) : null;
        if (!card || !extra) return;
        const expanded = card.classList.toggle('expanded');
        button.textContent = expanded ? 'Show less' : 'Read more';
        button.setAttribute('aria-expanded', String(expanded));

        if (!desktop.matches) {
          window.setTimeout(() => window.ScrollTrigger?.refresh(), 50);
          return;
        }

        if (!expanded) {
          const returnTop = returnPositions.get(card);
          returnPositions.delete(card);
          if (Number.isFinite(returnTop)) {
            window.requestAnimationFrame(() => scrollToPosition(returnTop));
          }
          return;
        }

        returnPositions.set(card, window.scrollY);
        window.requestAnimationFrame(() => {
          const cardRect = card.getBoundingClientRect();
          const extraRect = extra.getBoundingClientRect();
          const combinedTop = Math.min(cardRect.top, extraRect.top);
          const combinedBottom = Math.max(cardRect.bottom, extraRect.bottom);
          const viewportInset = 24;
          if (combinedTop >= viewportInset && combinedBottom <= window.innerHeight - viewportInset) return;

          const combinedHeight = combinedBottom - combinedTop;
          const offset = combinedHeight <= window.innerHeight - viewportInset * 2
            ? (combinedTop + combinedBottom) / 2 - window.innerHeight / 2
            : combinedTop - viewportInset;
          const projects = qs('#projects');
          const workStart = projects
            ? projects.getBoundingClientRect().top + window.scrollY
            : Number.POSITIVE_INFINITY;
          const maxJourneyTop = workStart - window.innerHeight - 2;
          const target = Math.max(0, Math.min(window.scrollY + offset, maxJourneyTop));
          scrollToPosition(target);
        });
      });
    });
  }

  function initTestimonials() {
    const carousel = qs('.recommendations__carousel');
    if (!carousel || typeof window.Swiper !== 'function') return;
    const pagination = qs('.recommendations__pagination');
    const swiper = new window.Swiper(carousel, {
      slidesPerView: 'auto',
      spaceBetween: 20,
      speed: 700,
      grabCursor: true,
      keyboard: { enabled: true },
      navigation: { nextEl: '.recommendations__arrow--next', prevEl: '.recommendations__arrow--prev' },
      breakpoints: {
        0: { spaceBetween: 12 },
        761: { spaceBetween: 20 },
      },
    });
    const updatePagination = () => {
      if (!pagination) return;
      pagination.textContent = `${swiper.snapIndex + 1} / ${swiper.snapGrid.length}`;
    };
    swiper.on('slideChange', updatePagination);
    swiper.on('resize', updatePagination);
    updatePagination();
  }

  function initFallbackReveals() {
    const elements = qsa('.reveal');
    elements.forEach((element) => {
      if (element.dataset.delay) element.style.setProperty('--reveal-delay', `${element.dataset.delay}ms`);
    });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -35px' });
    elements.forEach((element) => observer.observe(element));
  }

  function makeJourneyPath() {
    const grid = qs('.journey__grid');
    const pathBase = qs('.journey__path-base');
    const pathProgress = qs('.journey__path-progress');
    const cards = qsa('.jcard', grid || document);
    if (!grid || !pathBase || !pathProgress || cards.length < 2) return null;

    const gridRect = grid.getBoundingClientRect();
    const points = cards.map((card, index) => {
      const rect = card.getBoundingClientRect();
      const fromLeft = index % 2 === 1;
      return {
        x: fromLeft ? rect.right - gridRect.left : rect.left - gridRect.left,
        y: rect.top - gridRect.top + rect.height * 0.48,
      };
    });
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const point = points[index];
      const middleY = (previous.y + point.y) / 2;
      d += ` C ${previous.x} ${middleY}, ${point.x} ${middleY}, ${point.x} ${point.y}`;
    }
    qsa('.journey__path').forEach((svg) => svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${grid.scrollHeight}`));
    pathBase.setAttribute('d', d);
    pathProgress.setAttribute('d', d);
    return { d, progress: pathProgress };
  }

  function initDragCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    const work = qs('.work');
    if (!work) return;
    const cursor = document.createElement('div');
    cursor.className = 'work-cursor';
    cursor.innerHTML = '<span>SCROLL</span>';
    document.body.appendChild(cursor);
    work.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));
    work.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    work.addEventListener('pointermove', (event) => {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    });
  }

  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const plugins = [window.ScrollTrigger, window.MotionPathPlugin, window.DrawSVGPlugin, window.SplitText, window.ScrollToPlugin].filter(Boolean);
    window.gsap.registerPlugin(...plugins);
    const { gsap, ScrollTrigger } = window;
    const capabilities = qs('#capabilities');
    const capabilitiesHeading = qs('.caps__heading', capabilities);
    const syncCapabilitiesGeometry = () => {
      if (!capabilities || !capabilitiesHeading) return;
      capabilities.style.setProperty('--caps-heading-height', `${capabilitiesHeading.getBoundingClientRect().height}px`);
    };
    syncCapabilitiesGeometry();

    if (!reduceMotion && typeof window.Lenis === 'function') {
      window.lenis = new window.Lenis({ smoothWheel: true, syncTouch: true, duration: 1.08, autoRaf: false });
      window.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => window.lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const scrollToTarget = (hash) => {
      const target = qs(hash);
      if (!target) return;
      const targetId = target.id;
      let targetFinished = false;
      let targetFinishTimer;
      const finishTarget = () => {
        if (targetFinished) return;
        targetFinished = true;
        window.clearTimeout(targetFinishTimer);
        const expectedTop = targetId === 'projects' ? 1 : 0;
        const alignmentDelta = target.getBoundingClientRect().top - expectedTop;
        if (Math.abs(alignmentDelta) > 1) {
          const correctedTop = window.scrollY + alignmentDelta;
          if (window.lenis) {
            window.lenis.scrollTo(correctedTop, { immediate: true, force: true });
          } else {
            window.scrollTo({ top: correctedTop, behavior: 'auto' });
          }
        }

        if (targetId === 'projects') {
          document.body.classList.add('page--dark', 'page--work-entering', 'page--interior');
          setActive('projects');
          setWorkEntryBlend(1);
          return;
        }

        document.body.classList.remove('page--dark', 'page--work-entering');
        document.body.classList.toggle('page--interior', targetId !== 'home');
        setActive(targetId);
        const lightBackground = targetId === 'capabilities'
          ? 'var(--caps-canvas)'
          : targetId === 'how-i-work'
            ? 'var(--canvas)'
            : 'var(--canvas-deep)';
        setWorkEntryBlend(0, lightBackground);
      };

      if (window.lenis) {
        window.lenis.scrollTo(target, {
          duration: 1.15,
          offset: targetId === 'projects' ? 1 : 0,
          onComplete: finishTarget,
        });
        targetFinishTimer = window.setTimeout(finishTarget, 1450);
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        targetFinishTimer = window.setTimeout(finishTarget, reduceMotion ? 0 : 1150);
      }
    };

    // Convert the desktop page into one deliberate, reversible scroll sequence.
    let pageStepLocked = false;
    let pageStepNeedsFreshGesture = false;
    let pageStepToken = 0;
    let pageStepUnlockTimer;
    let cachedPageStops = null;
    let wheelGestureResetTimer;
    const wheelGesture = {
      direction: 0,
      distance: 0,
      consumed: false,
      packetCount: 0,
      lastEventAt: 0,
      inputType: null,
      reverseDistance: 0,
    };
    const WHEEL_GESTURE_GAP = 120;
    const TRACKPAD_GESTURE_GAP = 220;
    const TRACKPAD_TRIGGER_DISTANCE = 24;
    const WHEEL_REVERSE_DISTANCE = 64;
    const WHEEL_DISCRETE_DELTA = 80;
    const WHEEL_DISCRETE_EVENT_GAP = 90;
    const POST_LANDING_TRACKPAD_GAP = 120;
    const PAGE_STEP_EPSILON = 20;

    const isContinuousWheelGesture = () => wheelGesture.inputType === 'trackpad'
      || wheelGesture.packetCount > 1;
    const getWheelGestureGap = () => isContinuousWheelGesture()
      ? TRACKPAD_GESTURE_GAP
      : WHEEL_GESTURE_GAP;

    const clearWheelGesture = () => {
      wheelGesture.direction = 0;
      wheelGesture.distance = 0;
      wheelGesture.consumed = false;
      wheelGesture.packetCount = 0;
      wheelGesture.lastEventAt = 0;
      wheelGesture.inputType = null;
      wheelGesture.reverseDistance = 0;
    };

    const resetWheelGesture = () => {
      window.clearTimeout(wheelGestureResetTimer);
      const now = Date.now();
      const quietRemaining = Math.max(
        0,
        getWheelGestureGap() - (now - wheelGesture.lastEventAt)
      );
      if (pageStepLocked || quietRemaining > 0) {
        wheelGestureResetTimer = window.setTimeout(
          resetWheelGesture,
          Math.max(50, quietRemaining)
        );
        return;
      }
      clearWheelGesture();
    };

    const scheduleWheelGestureReset = () => {
      window.clearTimeout(wheelGestureResetTimer);
      wheelGestureResetTimer = window.setTimeout(resetWheelGesture, getWheelGestureGap());
    };

    const normalizeWheelDelta = (event) => {
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    const getJourneyStops = () => {
      const about = qs('#about');
      const projects = qs('#projects');
      const cards = qsa('.journey__grid > .jcard');
      if (!about || !projects || cards.length < 7) return null;

      const workTrigger = window.workPinScrollTrigger || window.ScrollTrigger?.getById('work-pin');
      const workStart = Number.isFinite(workTrigger?.start)
        ? workTrigger.start
        : projects.getBoundingClientRect().top + window.scrollY;
      const maxJourneyTarget = Math.max(about.offsetTop, workStart - window.innerHeight - 2);
      const cardBounds = (card) => {
        const rect = card.getBoundingClientRect();
        return {
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
        };
      };
      const pairTarget = (firstIndex, secondIndex) => {
        const first = cardBounds(cards[firstIndex]);
        const second = cardBounds(cards[secondIndex]);
        return Math.round((first.top + second.bottom - window.innerHeight) / 2);
      };

      const rawStops = [
        about.offsetTop,
        pairTarget(1, 2),
        pairTarget(3, 4),
        pairTarget(5, 6),
      ];
      const stops = rawStops.map((stop, index) => {
        const minimum = index ? rawStops[index - 1] + 1 : about.offsetTop;
        return Math.min(Math.max(stop, minimum), maxJourneyTarget);
      });

      return { stops, workStart, workTrigger };
    };

    const getPageStops = () => {
      if (cachedPageStops) return cachedPageStops;
      const journey = getJourneyStops();
      if (!journey) return [];
      const { stops: journeyStops, workStart, workTrigger } = journey;
      const capabilities = qs('#capabilities');
      const workEnd = Number.isFinite(workTrigger?.end)
        ? workTrigger.end
        : capabilities
          ? capabilities.getBoundingClientRect().top + window.scrollY - window.innerHeight
          : workStart;
      const work = qs('#projects');
      const rail = qs('.work__rail');
      const workCards = qsa('.work__rail .wcard:not(.wcard--all)');
      const maxWorkTravel = work && rail ? Math.max(0, rail.scrollWidth - work.clientWidth) : 0;
      const firstCardOffset = workCards[0]?.offsetLeft || 0;
      const workStops = workCards
        .filter((_card, index) => index % 2 === 0)
        .map((card, index, pairedCards) => {
          if (!maxWorkTravel || pairedCards.length < 2) return workStart;
          const cardTravel = Math.min(maxWorkTravel, Math.max(0, card.offsetLeft - firstCardOffset));
          const progress = cardTravel / maxWorkTravel;
          return workStart + (workEnd - workStart) * progress;
        });

      const stages = [
        { top: 0, section: 'home', type: 'hero' },
        ...journeyStops.map((top) => ({ top, section: 'about', type: 'journey' })),
        ...workStops.map((top) => ({ top, section: 'projects', type: 'work' })),
      ];

      if (capabilities) {
        const capabilitiesTop = capabilities.getBoundingClientRect().top + window.scrollY;
        stages.push({
          top: capabilitiesTop,
          section: 'capabilities',
          type: 'section',
        });
      }

      const addSectionStops = (selector, section) => {
        const element = qs(selector);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = rect.bottom + window.scrollY;
        const lastTop = Math.max(top, bottom - window.innerHeight);
        const distance = lastTop - top;
        const segments = Math.max(1, Math.ceil(distance / (window.innerHeight * 0.9)));
        for (let index = 0; index <= segments; index += 1) {
          stages.push({
            top: top + (distance * index) / segments,
            section,
            type: 'section',
          });
        }
      };

      const addCapabilityStops = () => {
        const section = qs('#capabilities');
        const intro = qs('.caps__intro', section);
        const cards = qsa('.caps__proofs .cap', section);
        if (!section || !intro || !cards.length) return;
        const stickyLine = Number.parseFloat(getComputedStyle(intro).top) || 0;

        cards.forEach((card, cardIndex) => {
          const top = card.getBoundingClientRect().top + window.scrollY - stickyLine;
          stages.push({
            top,
            section: 'capabilities',
            type: 'capability',
            card,
            cardIndex,
          });
        });
      };

      addCapabilityStops();
      addSectionStops('#leadership', 'leadership');
      addSectionStops('.leadership__manifesto', 'leadership');
      addSectionStops('#how-i-work', 'how-i-work');
      addSectionStops('#recommendations', 'recommendations');

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      stages.push({ top: maxScroll, section: 'recommendations', type: 'footer' });
      stages.forEach((stage) => {
        stage.top = Math.round(Math.max(0, Math.min(stage.top, maxScroll)));
      });
      stages.sort((a, b) => a.top - b.top);
      const minimumStepDistance = Math.max(88, window.innerHeight * 0.12);
      cachedPageStops = stages.reduce((stops, stage) => {
        const previous = stops[stops.length - 1];
        const preserveRecommendationsTop = stage.type === 'footer'
          && previous?.section === 'recommendations'
          && previous.type === 'section';
        if (!previous
          || stage.top - previous.top >= minimumStepDistance
          || preserveRecommendationsTop) {
          stops.push(stage);
        } else {
          stops[stops.length - 1] = stage;
        }
        return stops;
      }, []);
      return cachedPageStops;
    };

    const getPageStepDestination = (direction) => {
      const stages = getPageStops();
      if (!stages.length) return null;
      const y = window.scrollY;
      return direction > 0
        ? stages.find((stage) => stage.top > y + PAGE_STEP_EPSILON) || null
        : [...stages].reverse().find((stage) => stage.top < y - PAGE_STEP_EPSILON) || null;
    };

    const runPageStep = (destination) => {
      pageStepLocked = true;
      const token = ++pageStepToken;
      let stepFinished = false;
      const alignWorkToViewport = () => {
        const projects = qs('#projects');
        if (!projects) return;
        const top = projects.getBoundingClientRect().top;
        if (top <= 0.5 || top >= window.innerHeight) return;
        const correctedTop = window.scrollY + top + 1;
        if (window.lenis) window.lenis.scrollTo(correctedTop, { immediate: true, force: true });
        else window.scrollTo({ top: correctedTop });
      };
      const alignCapabilityToProofLine = () => {
        if (destination.type !== 'capability' || !destination.card?.isConnected) return;
        const intro = qs('.caps__intro');
        if (!intro) return;
        const stickyLine = Number.parseFloat(getComputedStyle(intro).top) || 0;
        const delta = destination.card.getBoundingClientRect().top - stickyLine;
        if (Math.abs(delta) <= 0.5) return;
        const correctedTop = window.scrollY + delta;
        if (window.lenis) window.lenis.scrollTo(correctedTop, { immediate: true, force: true });
        else window.scrollTo({ top: correctedTop });
      };
      const finishStep = () => {
        if (stepFinished || token !== pageStepToken) return;
        stepFinished = true;
        window.clearTimeout(pageStepUnlockTimer);
        if (destination.type === 'work') {
          document.body.classList.add('page--dark', 'page--work-entering');
          setActive('projects');
          setWorkEntryBlend(1);
          window.requestAnimationFrame(() => window.requestAnimationFrame(alignWorkToViewport));
        } else {
          document.body.classList.remove('page--dark', 'page--work-entering');
          setWorkEntryBlend(
            0,
            destination.section === 'capabilities'
              ? 'var(--caps-canvas)'
              : destination.section === 'how-i-work'
                ? 'var(--canvas)'
                : 'var(--canvas-deep)'
          );
          document.body.classList.toggle('page--interior', destination.type !== 'hero');
          setActive(destination.section);
          if (destination.type === 'capability') {
            window.requestAnimationFrame(() => window.requestAnimationFrame(alignCapabilityToProofLine));
          }
        }
        pageStepLocked = false;
        pageStepNeedsFreshGesture = true;
        window.clearTimeout(wheelGestureResetTimer);
        wheelGesture.distance = 0;
        wheelGesture.reverseDistance = 0;
      };

      // Lenis can occasionally lose its completion callback when ScrollTrigger
      // refreshes a pin mid-flight. Always release the wheel after the motion.
      pageStepUnlockTimer = window.setTimeout(finishStep, 1400);

      if (window.lenis) {
        window.lenis.scrollTo(destination.type === 'work' ? destination.top + 1 : destination.top, {
          duration: 0.82,
          lock: true,
          force: true,
          onComplete: finishStep,
        });
      } else {
        window.scrollTo({ top: destination.top, behavior: 'smooth' });
        window.clearTimeout(pageStepUnlockTimer);
        pageStepUnlockTimer = window.setTimeout(finishStep, 900);
      }
    };

    const stepThroughPage = (event) => {
      if (!desktop.matches || reduceMotion || event.ctrlKey) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.25) return;

      const delta = normalizeWheelDelta(event);
      if (Math.abs(delta) < 0.5) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const now = Date.now();
      const direction = delta > 0 ? 1 : -1;
      const eventGap = wheelGesture.lastEventAt ? now - wheelGesture.lastEventAt : Number.POSITIVE_INFINITY;
      const isDiscreteWheel = event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL
        || Math.abs(delta) >= WHEEL_DISCRETE_DELTA;

      if (pageStepLocked) {
        wheelGesture.lastEventAt = now;
        wheelGesture.inputType = isDiscreteWheel ? 'wheel' : 'trackpad';
        return;
      }

      if (pageStepNeedsFreshGesture) {
        const postLandingGap = isDiscreteWheel
          ? WHEEL_DISCRETE_EVENT_GAP
          : POST_LANDING_TRACKPAD_GAP;
        if (eventGap < postLandingGap) {
          wheelGesture.lastEventAt = now;
          wheelGesture.inputType = isDiscreteWheel ? 'wheel' : 'trackpad';
          return;
        }
        pageStepNeedsFreshGesture = false;
        clearWheelGesture();
      }

      wheelGesture.packetCount += 1;
      wheelGesture.lastEventAt = now;
      wheelGesture.inputType = isDiscreteWheel ? 'wheel' : 'trackpad';
      scheduleWheelGestureReset();

      if (wheelGesture.direction && wheelGesture.direction !== direction) {
        const immediateWheelReverse = isDiscreteWheel
          && eventGap >= WHEEL_DISCRETE_EVENT_GAP;
        if (wheelGesture.consumed
          && !immediateWheelReverse
          && eventGap < getWheelGestureGap()) {
          wheelGesture.reverseDistance += Math.min(Math.abs(delta), WHEEL_DISCRETE_DELTA);
          if (wheelGesture.reverseDistance < WHEEL_REVERSE_DISTANCE) return;
        }
        wheelGesture.distance = 0;
        wheelGesture.consumed = false;
        wheelGesture.packetCount = 1;
        wheelGesture.reverseDistance = 0;
      } else if (isDiscreteWheel && eventGap >= WHEEL_DISCRETE_EVENT_GAP) {
        wheelGesture.consumed = false;
        wheelGesture.distance = 0;
        wheelGesture.packetCount = 1;
        wheelGesture.reverseDistance = 0;
      } else {
        wheelGesture.reverseDistance = 0;
      }
      wheelGesture.direction = direction;
      if (wheelGesture.consumed) return;
      wheelGesture.distance += Math.min(Math.abs(delta), WHEEL_DISCRETE_DELTA);

      if (!isDiscreteWheel && wheelGesture.distance < TRACKPAD_TRIGGER_DISTANCE) return;

      wheelGesture.consumed = true;
      wheelGesture.distance = 0;
      const destination = getPageStepDestination(direction);
      if (!destination) return;

      runPageStep(destination);
    };
    window.addEventListener('wheel', stepThroughPage, { passive: false, capture: true });

    qsa('a[href^="#"]:not([data-booking])').forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;
        event.preventDefault();
        scrollToTarget(hash);
      });
    });

    if (!reduceMotion) {
      gsap.from('.hero__giant i', { yPercent: 72, opacity: 0, duration: 0.92, stagger: 0.055, ease: 'power4.out' });
      gsap.from('.hero__nav-link', { y: 18, opacity: 0, duration: 0.55, stagger: 0.045, delay: 0.72, ease: 'power3.out' });
      gsap.from(['.hero__photo', '.hero__headline', '.hero__chip', '.hero__foot'], { y: 34, opacity: 0, duration: 0.82, stagger: 0.08, delay: 0.92, ease: 'power3.out' });

      if (window.innerWidth > 760) {
        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: () => `+=${window.innerHeight}`,
            pin: '.hero__pin',
            pinSpacing: false,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
          .to('.hero__giant', { scale: 0.45, yPercent: -115, opacity: 0, transformOrigin: 'top center' }, 0)
          .to('.hero__photo', { scale: 0.67, yPercent: -28, opacity: 0, transformOrigin: 'center bottom' }, 0.03)
          .to('.hero__headline', { yPercent: -58, opacity: 0 }, 0.04)
          .to('.hero__nav', { y: -40, opacity: 0 }, 0.06)
          .to('.hero__chip--stats', { xPercent: -90, yPercent: -25, opacity: 0 }, 0.08)
          .to('.hero__chip--traits', { xPercent: 90, yPercent: -25, opacity: 0 }, 0.08)
          .to('.hero__foot', { yPercent: 90, opacity: 0 }, 0.1);
      }

      gsap.from('.journey .sec-head > *', {
        y: 48,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.journey', start: 'top 72%' },
      });

      let journeyDrawTween;
      let journeyTravellerTween;
      const rebuildJourneyMotion = () => {
        journeyDrawTween?.scrollTrigger?.kill();
        journeyDrawTween?.kill();
        journeyTravellerTween?.scrollTrigger?.kill();
        journeyTravellerTween?.kill();

        const pathData = makeJourneyPath();
        if (!pathData || !desktop.matches) return;

        gsap.set(pathData.progress, { drawSVG: '0%' });
        gsap.set('.journey__traveller', { rotation: 0 });
        journeyDrawTween = gsap.to(pathData.progress, {
          drawSVG: '100%',
          ease: 'none',
          scrollTrigger: { trigger: '.journey__grid', start: 'top 68%', end: 'bottom 55%', scrub: true },
        });
        journeyTravellerTween = gsap.to('.journey__traveller', {
          ease: 'none',
          motionPath: { path: pathData.d, align: pathData.progress, alignOrigin: [0.5, 0.5], autoRotate: false },
          scrollTrigger: { trigger: '.journey__grid', start: 'top 68%', end: 'bottom 55%', scrub: true },
        });
      };
      window.rebuildJourneyMotion = rebuildJourneyMotion;
      rebuildJourneyMotion();

      ScrollTrigger.matchMedia({
        '(min-width: 761px)': function () {
          const work = qs('.work');
          const rail = qs('.work__rail');
          if (!work || !rail) return;
          const getTravel = () => Math.max(0, rail.scrollWidth - work.clientWidth);
          const workTween = gsap.to(rail, {
            x: () => -getTravel(),
            ease: 'none',
            scrollTrigger: {
              id: 'work-pin',
              trigger: work,
              start: 'top top',
              end: () => `+=${Math.max(window.innerHeight * 4.2, getTravel() * 0.5)}`,
              pin: true,
              pinSpacing: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onEnter: () => document.body.classList.add('page--dark'),
              onEnterBack: () => document.body.classList.add('page--dark'),
              onLeave: () => document.body.classList.remove('page--dark'),
              onLeaveBack: () => document.body.classList.remove('page--dark'),
              onUpdate: (self) => {
                work.style.setProperty('--work-progress', `${Math.max(11, self.progress * 100)}%`);
                const count = qsa('.wcard:not(.wcard--all)', rail).length;
                const current = Math.min(count, Math.floor(self.progress * count) + 1);
                const label = qs('.work__counter span');
                if (label) label.textContent = String(current).padStart(2, '0');
              },
            },
          });
          window.workPinScrollTrigger = workTween.scrollTrigger;
        },
      });

      gsap.from('.caps__heading > *, .caps__intro > *', {
        y: 46,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.caps__layout', start: 'top 72%' },
      });
      qsa('.caps__proofs .cap').forEach((capability) => {
        gsap.from(capability, {
          opacity: 0,
          duration: 0.72,
          ease: 'power3.out',
          scrollTrigger: { trigger: capability, start: 'top 86%' },
        });
      });
      gsap.from('.bigcta__title > span', { yPercent: 80, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power4.out', scrollTrigger: { trigger: '.bigcta', start: 'top 65%' } });
    }

    const spyLinks = qsa('[data-spy]');
    const heroLinks = qsa('.hero__nav-link');
    const setActive = (id) => {
      document.body.dataset.section = id;
      document.documentElement.dataset.section = id;
      spyLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.spy === id));
      heroLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
    };
    const sectionIds = ['home', 'about', 'projects', 'capabilities', 'leadership', 'how-i-work', 'recommendations'];
    sectionIds.forEach((id) => {
      const section = qs(`#${id}`);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: id === 'projects' ? 'top top' : 'top 45%',
        end: 'bottom 45%',
        onEnter: () => setActive(id),
        onEnterBack: () => setActive(id),
      });
    });
    const leadershipManifesto = qs('.leadership__manifesto');
    if (leadershipManifesto) {
      const enterLeadershipManifesto = () => {
        document.body.classList.add('page--leadership-manifesto');
        setActive('leadership');
      };
      const leaveLeadershipManifesto = () => {
        document.body.classList.remove('page--leadership-manifesto');
      };
      ScrollTrigger.create({
        trigger: leadershipManifesto,
        start: 'top 45%',
        end: 'bottom 45%',
        onEnter: enterLeadershipManifesto,
        onEnterBack: enterLeadershipManifesto,
        onLeave: leaveLeadershipManifesto,
        onLeaveBack: leaveLeadershipManifesto,
      });
    }
    ScrollTrigger.create({
      trigger: '#about',
      start: 'top 85%',
      onEnter: () => document.body.classList.add('page--interior'),
      onLeaveBack: () => document.body.classList.remove('page--interior'),
    });
    let workBlendReleaseTimer;
    let latestWorkBlend = 0;
    const setWorkEntryBlend = (progress, lightBackground = 'var(--canvas-deep)') => {
      const amount = Math.max(0, Math.min(1, progress));
      const visibility = amount * amount * (3 - 2 * amount);
      const atWorkBoundary = amount >= 0.999;
      const atLightBoundary = amount <= 0.001;
      latestWorkBlend = amount;
      window.clearTimeout(workBlendReleaseTimer);
      document.documentElement.style.setProperty('--work-entry-light', lightBackground);
      document.documentElement.style.setProperty('--work-entry-pct', `${amount * 100}%`);
      document.documentElement.style.setProperty('--work-entry-rest', `${(1 - amount) * 100}%`);
      document.documentElement.style.setProperty('--work-entry-alpha', String(visibility));
      const setTransitionState = (active) => {
        document.documentElement.classList.toggle('is-work-transitioning', active);
        document.body.classList.toggle('is-work-transitioning', active);
      };

      if (!atWorkBoundary && !atLightBoundary) {
        setTransitionState(true);
        return;
      }

      const releaseBlend = () => {
        if (Math.abs(latestWorkBlend - amount) > 0.001) return;
        const workThemeReady = document.body.classList.contains('page--work-entering')
          && document.body.dataset.section === 'projects';
        const lightThemeReady = !document.body.classList.contains('page--dark')
          && !document.body.classList.contains('page--work-entering')
          && document.body.dataset.section !== 'projects';
        const endpointReady = atWorkBoundary ? workThemeReady : lightThemeReady;
        if (endpointReady) setTransitionState(false);
        else workBlendReleaseTimer = window.setTimeout(releaseBlend, 32);
      };

      if ((atWorkBoundary && document.body.dataset.section !== 'projects')
        || (atLightBoundary && (
          document.body.classList.contains('page--dark')
          || document.body.classList.contains('page--work-entering')
          || document.body.dataset.section === 'projects'
        ))) {
        setTransitionState(true);
        workBlendReleaseTimer = window.setTimeout(releaseBlend, 32);
      } else {
        releaseBlend();
      }
    };
    ScrollTrigger.create({
      trigger: '#projects',
      start: 'top bottom',
      end: 'top top',
      onUpdate: (self) => setWorkEntryBlend(self.progress, 'var(--canvas-deep)'),
      onLeaveBack: () => setWorkEntryBlend(0, 'var(--canvas-deep)'),
      onLeave: () => setWorkEntryBlend(1, 'var(--canvas-deep)'),
    });
    ScrollTrigger.create({
      trigger: '#capabilities',
      start: 'top bottom',
      end: 'top top',
      onUpdate: (self) => setWorkEntryBlend(1 - self.progress, 'var(--caps-canvas)'),
      onLeaveBack: () => setWorkEntryBlend(1, 'var(--caps-canvas)'),
      onLeave: () => setWorkEntryBlend(0, 'var(--caps-canvas)'),
    });
    ScrollTrigger.create({
      trigger: '#projects',
      start: 'top top',
      end: 'bottom top',
      onEnter: () => document.body.classList.add('page--work-entering'),
      onEnterBack: () => document.body.classList.add('page--work-entering'),
      onLeave: () => document.body.classList.remove('page--work-entering'),
      onLeaveBack: () => document.body.classList.remove('page--work-entering'),
    });

    let refreshTimer;
    const scheduleLayoutRefresh = (delay = 120) => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        syncCapabilitiesGeometry();
        window.rebuildJourneyMotion?.();
        ScrollTrigger.refresh();
        cachedPageStops = null;
      }, delay);
    };
    window.addEventListener('resize', () => scheduleLayoutRefresh(180));
    window.addEventListener('load', () => scheduleLayoutRefresh(60));
    document.fonts?.ready.then(() => scheduleLayoutRefresh(0));

    if ('ResizeObserver' in window) {
      const journeyResizeObserver = new ResizeObserver(() => scheduleLayoutRefresh(120));
      const journeyGrid = qs('.journey__grid');
      if (journeyGrid) journeyResizeObserver.observe(journeyGrid);
      qsa('.journey .jcard').forEach((card) => journeyResizeObserver.observe(card));
      if (capabilitiesHeading) journeyResizeObserver.observe(capabilitiesHeading);
    }
  }

  initMenu();
  initEmailCopy();
  initBooking();
  initJourneyExpanders();
  initTestimonials();
  initFallbackReveals();
  initDragCursor();
  initMotion();
}());
