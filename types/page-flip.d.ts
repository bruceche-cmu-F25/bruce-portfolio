/** page-flip 2.0.7 ships no typings. Only the surface the notebook uses. */
declare module 'page-flip' {
  export interface Point { x: number; y: number }
  export interface PageRect { left: number; top: number; width: number; height: number; pageWidth: number }
  export type FlipState = 'user_fold' | 'fold_corner' | 'flipping' | 'read'
  export type Orientation = 'portrait' | 'landscape'

  export interface FlipSetting {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    startPage?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startZIndex?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    clickEventForward?: boolean
    useMouseEvents?: boolean
    swipeDistance?: number
    showPageCorners?: boolean
    disableFlipByClick?: boolean
  }

  export class PageFlip {
    constructor(element: HTMLElement, setting: FlipSetting)
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void
    destroy(): void
    update(): void
    on<T = unknown>(event: 'init' | 'update' | 'flip' | 'changeState' | 'changeOrientation',
                    callback: (e: { data: T; object: PageFlip }) => void): PageFlip
    flip(page: number, corner?: 'top' | 'bottom'): void
    flipNext(corner?: 'top' | 'bottom'): void
    flipPrev(corner?: 'top' | 'bottom'): void
    turnToPage(page: number): void
    getPageCount(): number
    getCurrentPageIndex(): number
    getBoundsRect(): PageRect
    getOrientation(): Orientation
    getState(): FlipState
    /** the pointer handling; its getMousePos is overridable (see Notebook) */
    getUI(): object
    startUserTouch(pos: Point): void
    userMove(pos: Point, isTouch: boolean): void
    userStop(pos: Point, isSwipe?: boolean): void
  }
}
