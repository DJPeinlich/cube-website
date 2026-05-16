document.addEventListener('DOMContentLoaded', () => {
  // 0. Preloader Sequence
  const preloader = document.getElementById('preloader');
  if (preloader) {
      // Check if we've already shown the preloader in this session (this tab)
      if (sessionStorage.getItem('foocus_preloader_seen')) {
          preloader.style.display = 'none';
      } else {
          sessionStorage.setItem('foocus_preloader_seen', 'true');
          
          const originalOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
      
      const dotsOrder = [
          document.querySelector('.dot-150'), // 5 o'clock
          document.querySelector('.dot-210'), // 7 o'clock
          document.querySelector('.dot-270'), // 9 o'clock
          document.querySelector('.dot-330'), // 11 o'clock
          document.querySelector('.dot-30'),  // 1 o'clock
          document.querySelector('.dot-90')   // 3 o'clock (Orange)
      ];
      const cubeInterface = document.querySelector('.cube-interface');

      async function runPreloader() {
          // Initial wait so the user sees the empty state
          await new Promise(r => setTimeout(r, 400));
          
          for (let i = 0; i < dotsOrder.length; i++) {
              if (dotsOrder[i]) {
                  const delay = Math.random() * 900 + 100; // Random delay between 0.1s and 1s
                  await new Promise(r => setTimeout(r, delay));
                  
                  if (i === 5) {
                      dotsOrder[i].classList.add('active-orange');
                  } else {
                      dotsOrder[i].classList.add('active');
                  }
              }
          }
          
          // Wait exactly 1 second after the final orange dot
          await new Promise(r => setTimeout(r, 1000));
          
          // Ensure first section kicks off reveal animations early so it's visible through the hole
          const firstSection = document.querySelector('.hero.reveal');
          if (firstSection) firstSection.classList.add('active');
          
          preloader.classList.add('zooming');
          if (cubeInterface) cubeInterface.classList.add('zoom');
          
          // Wait for interface to scale up (2s transition)
          await new Promise(r => setTimeout(r, 2000));
          
          // Clean up
          preloader.style.display = 'none';
          document.body.style.overflow = originalOverflow;
      }
      
      runPreloader();
      }
  }

  // Scroll animations removed as per request


  // 2. FAQ Accordion Logic
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      
      question.addEventListener('click', () => {
          // Close all other active items
          faqItems.forEach(otherItem => {
              if (otherItem !== item && otherItem.classList.contains('active')) {
                  otherItem.classList.remove('active');
              }
          });
          
          // Toggle current item
          item.classList.toggle('active');
      });
  });

  // 3. Hero Parallax Drift (Immersive Effect)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Animate the entire hero section (orange background + text) to scroll up slower than the foreground
      gsap.to('.hero', {
          yPercent: -50, // Moves up by 50% of its height (creating a 0.5x parallax drift)
          ease: "none",
          scrollTrigger: {
              start: 0, // Start exactly at 0px scroll
              end: () => window.innerHeight, // End exactly after 100vh of scrolling
              scrub: true
          }
      });

      // Orange Window Parallax — the form content moves at 0.5x scroll speed,
      // making it appear "painted onto" the orange background layer.
      // MATH: fromTo y = -(H/2) → +(H/2) exactly halves the effective scroll speed.
      //       At 50% scroll progress (section center at viewport center), y = 0
      //       → content is perfectly centred exactly when you're mid-section.
      const ow = document.querySelector('.orange-window');
      if (ow) {
          gsap.fromTo('.orange-window .container',
              { y: () => -ow.offsetHeight * 0.5 },
              {
                  y: () => ow.offsetHeight * 0.5,
                  ease: 'none',
                  scrollTrigger: {
                      trigger: '.orange-window',
                      start: 'top bottom',
                      end:   'bottom top',
                      scrub: true,
                      invalidateOnRefresh: true
                  }
              }
          );
      }
  }

  // 4. Diagonal Rain Effect — contained inside .rain-zone
  // Canvas is absolutely positioned INSIDE the wrapper → overflow:hidden clips it to those sections.
  // Sections inside rain-zone are transparent, canvas is at z-index:0, section content at z-index:15.
  (function initRain() {
      const rainZone = document.querySelector('.rain-zone');
      if (!rainZone) return;

      const canvas = document.createElement('canvas');
      canvas.id = 'rain-canvas-zone';
      // CSS handles position:absolute, top/left/size, z-index, pointer-events
      rainZone.insertBefore(canvas, rainZone.firstChild);

      const ctx = canvas.getContext('2d');

      function resize() {
          canvas.width  = rainZone.offsetWidth;
          canvas.height = rainZone.offsetHeight;
      }
      resize();
      window.addEventListener('resize', () => { resize(); });

      // 30° slant from vertical → top-left ➜ bottom-right
      const ANGLE = Math.PI / 6;
      const SIN_A = Math.sin(ANGLE); // ≈ 0.500
      const COS_A = Math.cos(ANGLE); // ≈ 0.866

      // 1–1.4 cm at 96 dpi → radius 19–27 px
      const MIN_R = 19;
      const MAX_R = 27;
      const COUNT = 24;

      function newDot(scatter) {
          const r    = MIN_R + Math.random() * (MAX_R - MIN_R);
          const norm = (r - MIN_R) / (MAX_R - MIN_R); // 0=tiny,1=big
          const speed = (0.6 + norm * 1.2) * 2;              // tiny:1.2px/f, big:3.6px/f

          // 1 in 6 dots is orange, rest solid white
          const isOrange  = Math.random() < (1 / 6);
          const fillColor   = isOrange ? '#ed6f07' : '#ffffff';
          const strokeColor = '#000000';

          const W = canvas.width;
          const H = canvas.height;
          let x, y;

          if (scatter) {
              // Spread fully across the zone at start so it feels "already raining"
              x = Math.random() * (W + 200) - 100;
              y = Math.random() * (H + 200) - 100;
          } else {
              if (Math.random() < 0.55) {
                  x = -r + Math.random() * (W + r * 2);
                  y = -r;
              } else {
                  x = -r;
                  y = -r + Math.random() * H * 0.7;
              }
          }

          return { x, y, r, dx: SIN_A * speed, dy: COS_A * speed, fillColor, strokeColor };
      }

      const dots = Array.from({ length: COUNT }, () => newDot(true));

      function tick() {
          const W = canvas.width;
          const H = canvas.height;
          ctx.clearRect(0, 0, W, H);

          for (let i = 0; i < dots.length; i++) {
              const d = dots[i];
              d.x += d.dx;
              d.y += d.dy;

              if (d.x - d.r > W || d.y - d.r > H) {
                  dots[i] = newDot(false);
                  continue;
              }

              // 1. Draw Neobrutalist Shadow (top-left)
              const sOff = 7;
              ctx.beginPath();
              // Shadow is slightly larger for a "thicker" feel (d.r + 1)
              ctx.arc(d.x - sOff, d.y - sOff, d.r + 1, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(30,30,30,0.5)'; // 50% opacity shadow
              ctx.fill();

              // 2. Draw Dot Circle
              ctx.beginPath();
              ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
              ctx.fillStyle   = d.fillColor;
              ctx.fill();
              ctx.strokeStyle = '#000000';
              ctx.lineWidth   = 2;
              ctx.stroke();
          }

          requestAnimationFrame(tick);
      }

      tick();
  })();

  // 5. Sticky Header Entrance Logic
  // Header starts off-screen (see CSS translateY(-200%)). 
  // It slides in once we scroll past a threshold.
  const header = document.querySelector('.main-header');
  if (header) {
      window.addEventListener('scroll', () => {
          if (window.scrollY > 150) {
              header.classList.add('header-visible');
          } else {
              header.classList.remove('header-visible');
          }
      });
  }

});
