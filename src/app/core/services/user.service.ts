import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models';

export interface UpdateUserPayload {
  email?: string;
  nationalIdNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly api = inject(ApiService);

  getUserById(userId: number): Observable<User> {
    return this.api.get<User>(`/users/${userId}`);
  }

  updateUser(userId: number, payload: UpdateUserPayload): Observable<User> {
    return this.api.put<User>(`/users/${userId}`, payload);
  }
}
