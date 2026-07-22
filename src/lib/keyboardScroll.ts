import { useRef } from 'react';
import { ScrollView, TextInput } from 'react-native';

/**
 * Keeps a search usable while the keyboard is up. iOS only auto-scrolls far
 * enough to reveal the input itself — the results UNDER it stay hidden behind
 * the keyboard ("I type and nothing shows"). This scrolls the focused input
 * near the top of the scroll view instead, so the whole results box sits in
 * the visible strip above the keyboard.
 *
 * Use with `automaticallyAdjustKeyboardInsets` on the ScrollView (that inset
 * is what makes the extra scroll range exist at all):
 *   const { scrollRef, scrollFocusedIntoView } = useKeyboardScroll();
 *   <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets ...>
 *   <TextInput onFocus={scrollFocusedIntoView} ... />
 */
export function useKeyboardScroll(topOffset = 64) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollFocusedIntoView = () => {
    // wait for the keyboard (and its inset) to be in place, then glide
    setTimeout(() => {
      const scroll = scrollRef.current;
      // the focused native input, whichever one it is
      const focused = (TextInput as unknown as {
        State?: { currentlyFocusedInput?: () => unknown };
      }).State?.currentlyFocusedInput?.();
      const inner = (scroll as unknown as { getInnerViewNode?: () => unknown } | null)
        ?.getInnerViewNode?.();
      if (!scroll || !focused || !inner) return;
      (focused as {
        measureLayout: (
          node: unknown,
          onSuccess: (x: number, y: number) => void,
          onFail: () => void,
        ) => void;
      }).measureLayout(
        inner,
        (_x, y) => scroll.scrollTo({ y: Math.max(0, y - topOffset), animated: true }),
        () => {},
      );
    }, 300);
  };
  return { scrollRef, scrollFocusedIntoView };
}
