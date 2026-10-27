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
    for (let k = 0; k <= i; k++) {
      const s = this.steps[k];
      const t = gsap.timeline({ paused: true });
      const card = this.board.card(k + 1, s.say, `${s.cls ?? ''} st${s.stage}${k === i ? ' cur' : ' done'}`);
      card.enter(t);
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
    if (!anim) this.done();
  }

  /** the first press finishes a running card, the next one moves on */
  next() {
    if (this.tl?.isActive()) {
      this.tl.progress(1);
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
