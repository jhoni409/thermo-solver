// Shows step i: rebuilds the board up to it, then plays its card (or jumps to its end).

import gsap from 'gsap';
import type { Step } from '../lesson/lessons';
import type { Board } from '../lesson/board';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Player {
  i = -1;
  speed = 1;
  autoOn = false;
  private tl: gsap.core.Timeline | null = null;
  private wait: gsap.core.Tween | null = null;
  /** answers to "guess before you see" questions, by step */
  private picks = new Map<number, number>();
  /** a step waiting for its guess */
  private asking: (() => void) | null = null;

  constructor(
    readonly steps: Step[],
    private readonly board: Board,
    private readonly onStep: (i: number) => void,
  ) {}

  go(i: number, animate = true) {
    i = Math.max(0, Math.min(this.steps.length - 1, i));
    this.kill();
    this.board.reset();
    const anim = animate && !reducedMotion();
    this.asking = null;
    for (let k = 0; k <= i; k++) {
      const s = this.steps[k];
      const t = gsap.timeline({ paused: true });
      const card = this.board.card(k + 1, s.say, `${s.cls ?? ''} st${s.stage}${k === i ? ' cur' : ' done'}`);
      card.enter(t);
      if (s.predict) {
        s.pre?.(this.board);
        const pr = s.predict;
        if (k === i && !this.picks.has(k)) {
          // ask first; the content is built and played after the answer
          const reveal = (pick: number) => {
            if (this.asking !== revealOnce) return;
            this.asking = null;
            this.picks.set(k, pick);
            const t2 = gsap.timeline({ paused: true });
            s.run(card, t2, this.board);
            this.board.reveal(card, anim);
            if (!anim) {
              t2.progress(1);
              t2.kill();
              this.done();
            } else {
              this.tl = t2;
              t2.timeScale(this.speed);
              t2.eventCallback('onComplete', () => this.done());
              t2.play();
            }
          };
          const box = card.predict(pr.q, pr.options, pr.correct, undefined, reveal);
          const revealOnce = () => {
            // "next" without a guess: show the answer and go on
            card.body.removeChild(box);
            card.predict(pr.q, pr.options, pr.correct, -1, () => {});
            reveal(-1);
          };
          this.asking = revealOnce;
          if (!anim) t.progress(1);
          else {
            this.tl = t;
            t.timeScale(this.speed);
            t.play();
          }
          continue;
        }
        card.predict(pr.q, pr.options, pr.correct, this.picks.get(k) ?? -1, () => {});
      }
      s.run(card, t, this.board);
      if (k < i || !anim) {
        t.progress(1);
        t.kill();
      } else {
        this.tl = t;
        t.timeScale(this.speed);
        t.eventCallback('onComplete', () => this.done());
        t.play();
      }
    }
    this.i = i;
    this.board.reveal(this.board.cards[i], anim);
    this.onStep(i);
    if (!anim && !this.asking) this.done();
  }

  /** the first press finishes a running card, the next one moves on */
  next() {
    if (this.tl?.isActive()) {
      this.tl.progress(1);
      return;
    }
    if (this.asking) {
      this.asking();
      return;
    }
    if (this.i < this.steps.length - 1) this.go(this.i + 1);
  }

  back() {
    if (this.i > 0) this.go(this.i - 1, false);
  }

  jump(i: number) {
    this.go(i, false);
  }

  restart() {
    this.go(0);
  }

  set rate(s: number) {
    this.speed = s;
    this.tl?.timeScale(s);
  }

  setAuto(on: boolean) {
    this.autoOn = on;
    if (!on) this.wait?.kill();
    else if (!this.tl?.isActive()) this.queue();
    this.onStep(this.i);
  }

  stop() {
    this.autoOn = false;
    this.wait?.kill();
  }

  destroy() {
    this.kill();
  }

  private done() {
    this.tl = null;
    if (this.autoOn) this.queue();
  }

  private queue() {
    this.wait?.kill();
    if (this.asking) return; // autoplay waits for the guess
    if (this.i >= this.steps.length - 1) {
      this.autoOn = false;
      this.onStep(this.i);
      return;
    }
    this.wait = gsap.delayedCall(2.4 / this.speed, () => this.go(this.i + 1));
  }

  private kill() {
    this.tl?.kill();
    this.tl = null;
    this.wait?.kill();
    this.wait = null;
  }
}
