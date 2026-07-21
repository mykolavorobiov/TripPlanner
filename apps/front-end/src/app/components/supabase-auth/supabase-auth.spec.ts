import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseAuth } from './supabase-auth';

describe('SupabaseAuth', () => {
  let component: SupabaseAuth;
  let fixture: ComponentFixture<SupabaseAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupabaseAuth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupabaseAuth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
