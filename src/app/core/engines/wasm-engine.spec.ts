import { TestBed } from '@angular/core/testing';

import { WasmEngine } from './wasm-engine';

describe('WasmEngine', () => {
  let service: WasmEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WasmEngine);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
