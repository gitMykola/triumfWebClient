import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { routing } from './app.routing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AppComponent } from './app.component';
import { StartComponent } from './start';
import {HttpClientModule} from '@angular/common/http';
import {TranslatorService} from './translator';
import {AccountsService} from './_services/accounts.service';
import {CommonModule} from '@angular/common';
import {TxETHComponent} from './lib/Tx/txeth.component';
import {TxBTCComponent} from './lib/Tx/txbtc.component';

@NgModule({
  declarations: [
    AppComponent,
      StartComponent,
      TxETHComponent,
      TxBTCComponent
  ],
  imports: [
    BrowserModule,
      FormsModule,
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
        TxETHComponent,
        TxBTCComponent,
        BrowserModule
    ],
  providers: [
      TranslatorService,
      AccountsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
