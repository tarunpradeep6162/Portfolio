import { useEffect, useRef } from 'react';

export type AnimationType =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'rotateIn'
  | 'blurIn';

interface UseScrollAnimationOptions {
  type?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
}

const animationClasses: Record<AnimationType, string> = {
  fadeIn: 'opacity-0 group-data-[visible]:opacity-100',
  slideUp: 'translate-y-8 opacity-0 group-data-[visible]:translate-y-0 group-data-[visible]:opacity-100',
  slideDown:
    '-translate-y-8 opacity-0 group-data-[visible]:translate-y-0 group-data-[visible]:opacity-100',
  slideLeft:
    'translate-x-8 opacity-0 group-data-[visible]:translate-x-0 group-data-[visible]:opacity-100',
  slideRight:
    '-translate-x-8 opacity-0 group-data-[visible]:-translate-x-0 group-data-[visible]:opacity-100',
  scaleIn: 'scale-95 opacity-0 group-data-[visible]:scale-100 group-data-[visible]:opacity-100',
  rotateIn: 'rotate-12 opacity-0 group-data-[visible]:rotate-0 group-data-[visible]:opacity-100',
  blurIn: 'blur-sm opacity-0 group-data-[visible]:blur-0 group-data-[visible]:opacity-100',
};

export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
) {
  const {
    type = 'fadeIn',
    delay = 0,
    duration = 600,
    threshold = 0.1,
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (triggerOnce && hasTriggered.current) return;

          hasTriggered.current = true;
          element.style.transitionDelay = `${delay}ms`;
          element.style.transitionDuration = `${duration}ms`;
          element.style.transitionProperty = 'all';
          element.style.transitionTimingFunction = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
          element.dataset.visible = 'true';

          if (!triggerOnce) {
            element.addEventListener(
              'transitionend',
              () => {
                observer.unobserve(element);
              },
              { once: true }
            );
          } else {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          element.dataset.visible = 'false';
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [delay, duration, threshold, triggerOnce]);

  return {
    ref,
    className: animationClasses[type],
  };
}

export function useParallaxScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const scrollPercent = 1 - (rect.top + rect.height) / window.innerHeight;
      const offset = scrollPercent * 50; // Adjust the multiplier for effect intensity

      element.style.transform = `translateY(${offset}px)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return ref;
}

export function useCountUp(
  finalValue: number,
  options: { duration?: number; start?: number } = {}
) {
  const { duration = 2000, start = 0 } = options;
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasStarted.current) {
        hasStarted.current = true;

        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentValue = Math.round(start + (finalValue - start) * progress);

          element.textContent = currentValue.toLocaleString();

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
        observer.unobserve(element);
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [finalValue, duration, start]);

  return ref;
}
