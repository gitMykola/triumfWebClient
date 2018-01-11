import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-t-home',
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
    title = '';
    constructor() {
    }
    ngOnInit() {
        this.title = 'Home';
    }
}
