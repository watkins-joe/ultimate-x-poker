export default class HoldSelectionGesture {
  private activePointerId: number | null = null;
  private visitedCards = new Set<number>();

  begin(pointerId: number, cardIndex: number): number {
    this.activePointerId = pointerId;
    this.visitedCards.clear();
    this.visitedCards.add(cardIndex);
    return cardIndex;
  }

  visit(pointerId: number, cardIndex: number): number | null {
    if (
      pointerId !== this.activePointerId ||
      this.visitedCards.has(cardIndex)
    ) {
      return null;
    }

    this.visitedCards.add(cardIndex);
    return cardIndex;
  }

  end(pointerId: number): void {
    if (pointerId !== this.activePointerId) return;
    this.activePointerId = null;
    this.visitedCards.clear();
  }
}
