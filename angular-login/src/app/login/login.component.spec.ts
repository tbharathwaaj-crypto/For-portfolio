import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('disables sign in until the required fields are valid', () => {
    const submitButton = fixture.nativeElement.querySelector(
      '.submit-button'
    ) as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    const email = fixture.nativeElement.querySelector(
      '#email'
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      '#password'
    ) as HTMLInputElement;

    email.value = 'person@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'correct-horse-battery-staple';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });

  it('shows a welcome message when a valid login form is submitted', () => {
    const email = fixture.nativeElement.querySelector(
      '#email'
    ) as HTMLInputElement;
    const password = fixture.nativeElement.querySelector(
      '#password'
    ) as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    email.value = 'person@example.com';
    email.dispatchEvent(new Event('input'));
    password.value = 'correct-horse-battery-staple';
    password.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.notice').textContent.trim())
      .toBe('Welcome back, person@example.com. Authentication is ready to connect.');
  });

  it('toggles password visibility and updates its accessible label', () => {
    const password = fixture.nativeElement.querySelector(
      '#password'
    ) as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector(
      '.visibility-button'
    ) as HTMLButtonElement;

    expect(password.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');

    toggle.click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
  });

  it('shows feedback when a social sign-in option is selected', () => {
    const googleButton = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLButtonElement>('.social-button')
    ).find((button: HTMLButtonElement) => button.textContent?.includes('Google')) as HTMLButtonElement;

    googleButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.notice').textContent.trim())
      .toBe('Google sign-in can be connected to your authentication provider.');
  });

  it('keeps the remember-me option enabled by default', () => {
    const rememberMe = fixture.nativeElement.querySelector(
      'input[name="rememberMe"]'
    ) as HTMLInputElement;

    expect(component.rememberMe).toBe(true);
    expect(rememberMe.checked).toBe(true);
  });
});
