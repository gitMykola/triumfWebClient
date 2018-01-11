import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { routing } from './app.routing';

import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import {HomeComponent} from './home';
import {WalletComponent} from './_wallet';
import {AuthenticationService} from './_services';

@NgModule({
  declarations: [
    AppComponent,
      HomeComponent,
      WalletComponent
  ],
  imports: [
    BrowserModule,
      routing,
      NgbModule.forRoot(),
      ReactiveFormsModule
  ],
  providers: [
      AuthenticationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
