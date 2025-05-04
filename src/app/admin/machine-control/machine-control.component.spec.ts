import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineControlComponent } from './machine-control.component';

describe('MachineControlComponent', () => {
  let component: MachineControlComponent;
  let fixture: ComponentFixture<MachineControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
