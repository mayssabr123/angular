import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionSallesComponent } from './gestion-salles.component';

describe('GestionSallesComponent', () => {
  let component: GestionSallesComponent;
  let fixture: ComponentFixture<GestionSallesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionSallesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionSallesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
