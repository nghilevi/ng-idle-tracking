import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { EvaToastService, ToasterPosition } from '@platform/ui/components';
import {
  fromEvent, interval, merge, Observable, Subject, Subscription,
} from 'rxjs';
import {
  first, skipWhile, switchMap, take, takeUntil, tap,
} from 'rxjs/operators';

enum AuthPath {
  Root = '/',
  SignIn = '/auth/sign-in',
  SignOut = '/auth/sign-out',
}
@Injectable({ providedIn: 'root' })
export class IdleTrackingService {
  idleTimeout = 10; // 60 * 90; // 60 sec x 90 mins

  subscriptions: Subscription[] = [];

  constructor(private router: Router, private evaToastService: EvaToastService) {
    this.router.events
      .pipe(first((evt) => evt instanceof NavigationEnd))
      .subscribe(() => {
        this.start(); // start idle tracking after page fully loaded/navigated
      });
  }

  //  ---------------- MAIN FUNCTIONS ----------------
  // call on the application top container component's constructor
  public start(idleTimeout?: number): void {
    if (!this.shouldTrackingStart()) {
      return;
    }
    this.setIdleTimeout(idleTimeout);

    const userEventsSub: Subject<void> = new Subject();
    const idleCountdown$ = this.createIdleCountdown$();
    const idleCountdownAfterUserEvents$ = this.createUserEvents$().pipe(
      tap(() => userEventsSub.next()),
      switchMap(() => idleCountdown$),
    );

    this.subscriptions[0] = this.subscribe(
      idleCountdown$.pipe(takeUntil(userEventsSub)),
    );
    this.subscriptions[1] = this.subscribe(idleCountdownAfterUserEvents$);
  }

  // stop tracking. call on user signed out
  public stop() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }

  //  ---------------- UTILS ----------------
  public shouldTrackingStart() {
    return this.wasUserInsideApp() && !this.hasTrackingStarted();
  }

  public hasTrackingStarted() {
    return !!this.subscriptions[0];
  }

  public wasUserInsideApp() {
    return ([AuthPath.Root, AuthPath.SignIn] as string[]).indexOf(
      this.router.url,
    ) === -1;
  }

  // eslint-disable-next-line class-methods-use-this
  createUserEvents$(): Observable<Event> {
    const userEvents: [Document | Window, string][] = [
      [document, 'click'],
      [document, 'wheel'],
      [document, 'scroll'],
      [document, 'mousemove'],
      [document, 'keyup'],
      [window, 'resize'],
      [window, 'scroll'],
      [window, 'mousemove'],
    ];
    return merge(...userEvents.map((x) => fromEvent(x[0], x[1])));
  }

  createIdleCountdown$() {
    const TRACKING_INTERVAL = 1000; // 1 second
    return interval(TRACKING_INTERVAL).pipe(
      take(this.idleTimeout),
    );
  }

  subscribe(obs$: Observable<any>) {
    return obs$
      .pipe(
        skipWhile(this.isUnderThreshold),
      )
      .subscribe(this.stopTrackingAndLogOut);
  }

  private setIdleTimeout(idleTimeout?: number) {
    if (idleTimeout && !this.hasTrackingStarted()) {
      this.idleTimeout = idleTimeout;
    }
  }

  private isUnderThreshold = (timelapsed: number) => timelapsed !== this.idleTimeout - 1;

  private stopTrackingAndLogOut = () => {
    this.stop();
    this.router.navigateByUrl(AuthPath.SignOut);
    // TODO unfortunately there is currently no way to set customized timeout using EvaToastService. The toast will disappear after 4 secs
    this.evaToastService.showToast('Session timeout', 'Your session has expired. Please login', 'warning', ToasterPosition.topRight);
  };
}
