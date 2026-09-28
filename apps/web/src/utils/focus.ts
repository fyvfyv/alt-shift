export function focusField(form: HTMLFormElement | null, name: string, options?: FocusOptions) {
  const field = form?.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus(options);
}

// preventScroll: the button is already where the user is looking.
export function focusSubmit(form: HTMLFormElement | null): void {
  form?.querySelector<HTMLElement>('button[type="submit"]')?.focus({ preventScroll: true });
}

// On a phone the preview sits under the form; beside it, nothing needs to move.
export function sitsBelow(element: HTMLElement, anchor: HTMLElement): boolean {
  return element.offsetTop > anchor.offsetTop;
}

export function scrollIntoViewIfBelow(element: HTMLElement | null, anchor: HTMLElement | null) {
  if (element && anchor && sitsBelow(element, anchor)) element.scrollIntoView({ block: 'start' });
}
