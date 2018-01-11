import { Injectable } from '@angular/core';

@Injectable()
export class AuthenticationService {
    public auth: boolean;

    constructor() {
        this.auth = false;
    }
    login(username: string, password: string): boolean {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        if (currentUser && currentUser.name === username && currentUser.hash === password) {
            this.auth = true;
            return true;
        } else {
            return false;
        }
    }
    logout(): void {
        this.auth = false;
    }
    createUser(username: string, password: string): void {
        const newUser = {
            name: username,
            hash: password
        };
        localStorage.setItem('user', JSON.stringify(newUser));
    }
}
