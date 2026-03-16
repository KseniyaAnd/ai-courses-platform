import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  countdown(totalSeconds: number): Observable<number> {
    const safeTotal = Math.max(0, Math.floor(totalSeconds));

    return timer(0, 1000).pipe(
      map((elapsed) => safeTotal - elapsed),
      takeWhile((remaining) => remaining >= 0),
    );
  }
}
