import { TestBed } from '@angular/core/testing';

import { CanvasEngine } from './canvas-engine';

describe('CanvasEngine', () => {
  let service: CanvasEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
