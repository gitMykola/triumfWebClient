import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../_services';
import { Router } from '@angular/router';

@Component({
    selector: 'app-t-home',
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
    public loginForm: FormGroup;
    public userName: string;
    public userEmail: string;
    public userPass: string;
    public userCPass: string;
    title: string;
    logi: boolean;
    formVisible: boolean;
    error: string;
    constructor(
        private authService: AuthenticationService,
        private fb: FormBuilder,
        private router: Router
    ) {
    }
    ngOnInit() {
        this.title = 'TriumfCoin';
        this.formVisible = false;
        this.loginForm = this.fb.group({
            tname: [this.userName, [Validators.required]],
            temail: [this.userEmail, [Validators.required]],
            tpassword: [this.userPass, [Validators.required]],
            tcpassword: [this.userCPass, [Validators.required]],
            });
    }
    login() {
       if (this.authService.login(
           this.loginForm.getRawValue().tname,
           this.loginForm.getRawValue().tpassword)) {
           this.formVisible = false;
           this.router.navigate(['/wallet']);
       } else {
           this.error = 'Wrong login data.';
       }
    }
    logout() {}
    create() {
        if (this.loginForm.getRawValue().tpassword !== this.loginForm.getRawValue().tcpassword) {
            this.error = 'Confirm password error';
        } else {
            this.authService.createUser(
                this.loginForm.getRawValue().tname,
                this.loginForm.getRawValue().tpassword,
                this.loginForm.getRawValue().temail
            );
            this.logi = true;
        }
    }
}
