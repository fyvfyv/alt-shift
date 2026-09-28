import type { DashboardItem } from '../../types';

type ButtonRef = (button: HTMLButtonElement | null) => (() => void) | undefined;

// Where keyboard focus goes as cards come, go, and turn from a letter on its way into a letter.
export class CardFocus {
  readonly #firstButtons = new Map<string, HTMLButtonElement>();
  readonly #copyButtons = new Map<string, HTMLButtonElement>();
  // The card on its way that last had focus: it may be replaced by its letter's card.
  #focusedRun: string | null = null;
  // Where focus goes once the list has re-rendered: a card's first button, or null for the heading.
  #pending: { id: string | null } | null = null;

  firstButton = (id: string): ButtonRef => this.#register(this.#firstButtons, id);

  copyButton = (id: string): ButtonRef => this.#register(this.#copyButtons, id);

  track = (event: FocusEvent) => {
    const card = event.target instanceof Element ? event.target.closest('[data-run]') : null;
    this.#focusedRun = card?.getAttribute('data-run') ?? null;
  };

  // After a card goes: the next card's first button, else the page heading.
  afterRemoval(nextId: string | undefined) {
    this.#pending = { id: nextId ?? null };
  }

  // Try Again swaps a card's footer; focus stays on the card, on its first button.
  toFirstButton(id: string) {
    this.#pending = { id };
  }

  // Runs once the list has re-rendered, so the card that went is gone and focus lands in place.
  settle(items: DashboardItem[], heading: HTMLElement | null) {
    if (this.#pending) {
      const { id } = this.#pending;
      this.#pending = null;
      const button = id === null ? undefined : this.#firstButtons.get(id);
      (button ?? heading)?.focus();
      return;
    }
    this.#handOff(items);
  }

  // A card that had focus when its letter was saved hands it to the new card's Copy.
  #handOff(items: DashboardItem[]) {
    const id = this.#focusedRun;
    const saved = items.some((item) => item.id === id && 'letter' in item);
    const focusLost = !document.activeElement || document.activeElement === document.body;
    if (id === null || !saved || !focusLost) return;
    this.#focusedRun = null;
    this.#copyButtons.get(id)?.focus();
  }

  #register(buttons: Map<string, HTMLButtonElement>, id: string): ButtonRef {
    return (button) => {
      if (!button) return;
      buttons.set(id, button);
      return () => void buttons.delete(id);
    };
  }
}
