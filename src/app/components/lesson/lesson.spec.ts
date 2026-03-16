import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonComponent } from './lesson';

describe('Lesson', () => {
  let component: LessonComponent;
  let fixture: ComponentFixture<LessonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
