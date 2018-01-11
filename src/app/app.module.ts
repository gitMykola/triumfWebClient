import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
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
      routing,
      NgbModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
