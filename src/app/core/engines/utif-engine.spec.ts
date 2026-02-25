import { TestBed } from '@angular/core/testing';

import { UtifEngine } from './utif-engine';

describe('UtifEngine', () => {
  let service: UtifEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtifEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
