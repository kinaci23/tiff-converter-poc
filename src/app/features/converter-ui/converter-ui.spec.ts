import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConverterUi } from './converter-ui';

describe('ConverterUi', () => {
  let component: ConverterUi;
  let fixture: ComponentFixture<ConverterUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConverterUi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConverterUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
