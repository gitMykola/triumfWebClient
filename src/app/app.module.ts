import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { routing } from './app.routing';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { AppComponent } from './app.component';
import { StartComponent } from './start';
import {HomeComponent} from './home';
import {WalletComponent} from './_wallet';
import {AuthenticationService} from './_services';
import {HttpClientModule} from '@angular/common/http';
import {TranslatorService} from './translator';
import {AccountsService} from './_services/accounts.service';
import {CommonModule} from '@angular/common';
import {TxComponent} from './lib/Tx/tx.component';

@NgModule({
  declarations: [
    AppComponent,
      HomeComponent,
      WalletComponent,
      StartComponent,
      TxComponent
  ],
  imports: [
    BrowserModule,
      routing,
      NgbModule.forRoot(),
      ReactiveFormsModule,
      HttpClientModule,
      CommonModule
  ],
    exports: [
        AppComponent,
        FormsModule,
        ReactiveFormsModule,
        TxComponent
    ],
  providers: [
      AuthenticationService,
      TranslatorService,
      AccountsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
