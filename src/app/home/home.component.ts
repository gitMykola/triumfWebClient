import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthenticationService } from '../_services';
import { Router } from '@angular/router';

@Component({
    selector: 'app-t-home',
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
    constructor(
    ) {
    }
    ngOnInit() {
    }
}
