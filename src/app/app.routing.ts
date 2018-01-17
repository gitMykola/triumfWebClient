import { Routes, RouterModule } from '@angular/router';
import { StartComponent } from './start';
import { WalletComponent } from './_wallet';

const appRoutes: Routes = [
    { path: 'wallet', component: WalletComponent },
    { path: 'start', component: StartComponent },
    { path: '', component: WalletComponent},

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

export const routing = RouterModule.forRoot(appRoutes);
