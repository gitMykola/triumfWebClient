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
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatStepperModule,
} from '@angular/material';

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
      BrowserAnimationsModule,
      FormsModule,
      MatNativeDateModule,
      routing,
      NgbModule.forRoot(),
      ReactiveFormsModule,
      HttpClientModule,
      CommonModule,
      MatTableModule,
      MatTabsModule,
      MatToolbarModule,
      MatTooltipModule,
  ],
    exports: [
        AppComponent,
        FormsModule,
        ReactiveFormsModule,
        TxComponent,
        MatTableModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule,
        BrowserAnimationsModule,
        BrowserModule
    ],
  providers: [
      AuthenticationService,
      TranslatorService,
      AccountsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
