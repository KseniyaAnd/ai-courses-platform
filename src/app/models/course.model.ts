import { Lesson } from './lesson.model';
import { Test } from './test.model';

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  test: Test;
}
