import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlogComponent } from './plog.component';

describe('PlogComponent', () => {
  let component: PlogComponent;
  let fixture: ComponentFixture<PlogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PlogComponent]
    });
    fixture = TestBed.createComponent(PlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
