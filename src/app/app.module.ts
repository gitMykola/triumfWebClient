import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { routing } from './app.routing';


import { AppComponent } from './app.component';
import {HomeComponent} from './home';
import {WalletComponent} from './_wallet';

@NgModule({
  declarations: [
    AppComponent,
      HomeComponent,
      WalletComponent
  ],
  imports: [
    BrowserModule,
      routing
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
