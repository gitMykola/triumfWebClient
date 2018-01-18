import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { routing } from './app.routing';

import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { StartComponent } from './start';
import {HomeComponent} from './home';
import {WalletComponent} from './_wallet';
import {AuthenticationService} from './_services';
import {HttpClientModule} from '@angular/common/http';
import {TranslatorService} from './translator';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTabsModule} from '@angular/material';
import {EthComponent} from './eth';

@NgModule({
  declarations: [
    AppComponent,
      HomeComponent,
      WalletComponent,
      StartComponent,
      EthComponent
  ],
  imports: [
    BrowserModule,
      routing,
      NgbModule.forRoot(),
      ReactiveFormsModule,
      HttpClientModule,
      BrowserAnimationsModule,
      MatTabsModule
  ],
  providers: [
      AuthenticationService,
      TranslatorService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
