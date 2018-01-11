import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home';
import { WalletComponent } from './_wallet';

const appRoutes: Routes = [
    { path: 'wallet', component: WalletComponent },
    { path: '', component: HomeComponent},

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes);
