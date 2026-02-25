import { Component } from '@angular/core';
import { ConverterUiComponent } from './features/converter-ui/converter-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ConverterUiComponent], 
  template: `<app-converter-ui></app-converter-ui>`
})
export class AppComponent { }