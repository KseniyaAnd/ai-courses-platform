import { Injectable } from '@angular/core';

export type UserProfile = {
  name: string;
  email: string;
  avatarUrl: string;
};

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly profile: UserProfile = {
    name: 'Student',
    email: 'student@example.com',
    avatarUrl: 'https://i.pravatar.cc/200?img=13',
  };

  getProfile(): UserProfile {
    return this.profile;
  }
}
