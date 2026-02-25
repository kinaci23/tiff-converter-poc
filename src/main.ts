import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // Uzantı olmadan sadece dosya adı

bootstrapApplication(AppComponent)
  .catch((err) => console.error(err));