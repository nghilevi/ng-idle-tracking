import { TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { EvaToastService, UiComponentsModule } from '@platform/ui/components';
import { noop, of, Subscription } from 'rxjs';
import { IdleTrackingService } from './idle.tracking.service';

describe('IdleTrackingService', () => {
  let idleTrackingService: IdleTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([]), UiComponentsModule],
      providers: [IdleTrackingService, EvaToastService],
    });
  });

  describe('start', () => {
    beforeEach(() => {
      idleTrackingService = TestBed.inject(IdleTrackingService);
    });

    it('should NOT track if shouldTrackingStart() return false', () => {
      jest.spyOn(idleTrackingService, 'shouldTrackingStart').mockReturnValue(false);
      idleTrackingService.start();
      expect(idleTrackingService.subscriptions.length).toBe(0);
    });

    it('should track if shouldTrackingStart() return true', () => {
      jest.spyOn(idleTrackingService, 'shouldTrackingStart').mockReturnValue(true);
      jest.spyOn(idleTrackingService, 'createUserEvents$').mockReturnValue(
        of(noop),
      );

      jest.spyOn(
        idleTrackingService,
        'createIdleCountdown$',
      ).mockReturnValue(
        of(1),
      );

      jest.spyOn(idleTrackingService, 'subscribe').mockReturnValue({} as Subscription);

      idleTrackingService.start();
      expect(idleTrackingService.subscriptions.length).toBe(2);
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      jest.spyOn(IdleTrackingService.prototype, 'start');
      idleTrackingService = TestBed.inject(IdleTrackingService);
      const sub = {
        unsubscribe: noop,
      } as Subscription;
      idleTrackingService.subscriptions = [sub, sub];
    });

    it('should remove all subscriptions', () => {
      expect(idleTrackingService.subscriptions.length).toBe(2);
      idleTrackingService.stop();
      expect(idleTrackingService.subscriptions.length).toBe(0);
    });
  });

  describe('hasTrackingStarted', () => {
    beforeEach(() => {
      jest.spyOn(IdleTrackingService.prototype, 'start');
      idleTrackingService = TestBed.inject(IdleTrackingService);
    });

    it('should return FALSE when there is no subscriptions', () => {
      idleTrackingService.subscriptions = [];
      expect(idleTrackingService.hasTrackingStarted()).toBe(false);
    });

    it('should return TRUE when there is at least 1 subscription', () => {
      idleTrackingService.subscriptions = [{} as Subscription];
      expect(idleTrackingService.hasTrackingStarted()).toBe(true);
    });
  });
});
