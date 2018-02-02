import { Routes, RouterModule } from '@angular/router';
import { StartComponent } from './start';

const appRoutes: Routes = [
    { path: 'start', component: StartComponent },
    { path: '', component: StartComponent},

    // otherwise redirect to home
    { path: '**', redirectTo: 'start' }
];

export const routing = RouterModule.forRoot(appRoutes);
