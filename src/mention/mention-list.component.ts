import {
  Component, ElementRef, Output, EventEmitter, ViewChild, Input,
  TemplateRef, OnInit
} from '@angular/core';

import {isInputOrTextAreaElement, getContentEditableCaretCoords} from './mention-utils';
import {getCaretCoordinates} from './caret-coords';

export interface IMentionListConfig {
  headerTemplate?: TemplateRef<any>;
  containerClasses?: string;
  listClasses?: string;
  activeOnHover?: boolean;
  position?: 'relative' | 'fixed';
}

/**
 * Angular 2 Mentions.
 * https://github.com/dmacfarlane/angular-mentions
 *
 * Copyright (c) 2016 Dan MacFarlane
 */
@Component({
  selector: 'mention-list',
  styles: [`
    .scrollable-menu {
      display: block;
      height: auto;
      max-height: 300px;
      overflow: auto;
      margin-bottom: 0;
    }
  `, `
    .dropdown-menu {
      display: block;
    }
  `, `.dropdown-menu ul {
    list-style: none;
    padding-inline-start: 0;
  }
  `, `
    .dropdown-menu ul > li > a {
      display: block;
      padding: 3px 20px;
      clear: both;
      font-weight: 400;
      line-height: 1.42857143;
      color: #333;
      white-space: nowrap;
      cursor: pointer;
    }
  `, `.dropdown-menu ul > li > a:hover {
    text-decoration: none;
    background-color: #f5f5f5;
  }
  `, `
    [hidden] {
      display: none;
    }
  `, `
    .dropdown-menu ul>.active>a, .dropdown-menu ul>.active>a:focus, .dropdown-menu ul>.active>a:hover {
      color: #fff;
      text-decoration: none;
      background-color: #337ab7;
      outline: 0;
    }
  `],
  template: `
    <ng-template #defaultItemTemplate let-item="item">
      {{item[labelKey]}}
    </ng-template>

    <div #dropdown class="dropdown-menu" [hidden]="hidden">
      <ng-container *ngIf="mentionListConfig" [ngTemplateOutlet]="mentionListConfig.headerTemplate"></ng-container>
      <ul #list [class]="mentionListConfig.listClasses ? mentionListConfig.listClasses : 'scrollable-menu'">
        <li *ngFor="let item of items; let i = index" [class.active]="activeIndex==i">
          <a class="dropdown-item" (mousedown)="activeIndex=i;itemClick.emit();$event.preventDefault()" 
             (mouseenter)="mentionListConfig.activeOnHover && activateItem(i)" >
            <ng-template [ngTemplateOutlet]="_itemTemplate" [ngTemplateOutletContext]="{'item':item}"></ng-template>
          </a>
        </li>
      </ul>
    </div>`
})
export class MentionListComponent implements OnInit  {
  @Input() mentionListConfig: IMentionListConfig;
  @Input() labelKey = 'label';

  @Output() itemClick = new EventEmitter();

  @ViewChild('list') list: ElementRef;
  @ViewChild('dropdown') dropdown: ElementRef;
  @ViewChild('defaultItemTemplate') defaultItemTemplate: TemplateRef<any>;

  @Input() set itemTemplate(template: TemplateRef<any>) {
    if (!template) {
      this._itemTemplate = this.defaultItemTemplate;
    } else {
      this._itemTemplate = template;
    }
  };

  _itemTemplate: TemplateRef<any>;
  items = [];
  activeIndex = 0;
  hidden = false;

  constructor(private _element: ElementRef) {
  }

  ngOnInit() {
    if (!this.mentionListConfig) {
      this.mentionListConfig = {listClasses: '', position: 'relative'};
    } else if (!this.mentionListConfig.position) {
      this.mentionListConfig.position = 'relative';
    }

    if (!this._itemTemplate) {
      this._itemTemplate = this.defaultItemTemplate;
    }
  }

  // lots of confusion here between relative coordinates and containers
  position(nativeParentElement, iframe: HTMLIFrameElement = null) {
    let coords;

    if (this.mentionListConfig.position === 'relative') {
      coords = this.getRelativeCoords(nativeParentElement, iframe);
    } else if (this.mentionListConfig.position === 'fixed') {
      coords = this.getFixedCoords(nativeParentElement);
    }

    const el: HTMLElement = this._element.nativeElement;
    el.style.position = this.mentionListConfig.position === 'relative' ? 'absolute' : 'fixed';
    el.style.left = coords.left + 'px';
    el.style.top = coords.top + 'px';

    this.checkAndFixOutsideViewList(nativeParentElement, iframe, coords);
  }

  private getFixedCoords(nativeParentElement: HTMLInputElement, iframe: HTMLIFrameElement = null): {top: number, left: number} {
    const coords: {top: number, left: number, height?: number } = isInputOrTextAreaElement(nativeParentElement)
      ? getCaretCoordinates(nativeParentElement, nativeParentElement.selectionStart)
      : getContentEditableCaretCoords({iframe: iframe}, true);

    coords.top += coords.height ? coords.height : 16;

    return coords;
  }

  private getRelativeCoords(nativeParentElement: HTMLInputElement, iframe: HTMLIFrameElement): {top: number, left: number} {
    let coords = {top: 0, left: 0};

    if (isInputOrTextAreaElement(nativeParentElement)) {
      // parent elements need to have position:relative for this to work correctly?
      coords = getCaretCoordinates(nativeParentElement, nativeParentElement.selectionStart);
      coords.top = nativeParentElement.offsetTop + coords.top + 16;
      coords.left = nativeParentElement.offsetLeft + coords.left;
    } else if (iframe) {
      const context: { iframe: HTMLIFrameElement, parent: Element } = {iframe: iframe, parent: iframe.offsetParent};
      coords = getContentEditableCaretCoords(context);
    } else {
      // bounding rectangles are relative to view, offsets are relative to container?
      const doc = document.documentElement;
      const caretRelativeToView = getContentEditableCaretCoords({iframe: iframe});
      const parentRelativeToContainer: ClientRect = nativeParentElement.getBoundingClientRect();
      const scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
      const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

      coords.top = caretRelativeToView.top - parentRelativeToContainer.top + nativeParentElement.offsetTop - scrollTop;
      coords.left = caretRelativeToView.left - parentRelativeToContainer.left + nativeParentElement.offsetLeft - scrollLeft;
    }

    return coords;
  }


  private checkAndFixOutsideViewList(nativeParentElement: HTMLInputElement, iframe: HTMLIFrameElement, coords) {
    const el: HTMLElement = this._element.nativeElement;

    this.dropdown.nativeElement.style.height = this.list.nativeElement.style.height = 'auto';
    this.dropdown.nativeElement.style.opacity = 0;

    setTimeout(() => {
      const listViewportOffset: ClientRect = this.list.nativeElement.getBoundingClientRect();
      const dropdownViewportOffset: ClientRect = this.dropdown.nativeElement.getBoundingClientRect();

      const doc = document.documentElement;
      const fontHeight = isInputOrTextAreaElement(nativeParentElement)
        ? getCaretCoordinates(nativeParentElement, nativeParentElement.selectionStart).top + 16
        : getContentEditableCaretCoords({iframe: iframe}).height + 9;

      if (listViewportOffset.bottom > doc.clientHeight) {
        let downHeight = dropdownViewportOffset.height - (listViewportOffset.bottom - doc.clientHeight);
        let upHeight = dropdownViewportOffset.top - fontHeight;

        downHeight = (downHeight > 300 ? 300 : downHeight);
        upHeight = (upHeight > 300 ? 300 : upHeight);

        if (downHeight >= upHeight) {
          this.list.nativeElement.style.height = (listViewportOffset.height > downHeight ? downHeight : listViewportOffset.height) + 'px';
        } else {
          const height = listViewportOffset.height > upHeight ? upHeight : listViewportOffset.height;
          this.list.nativeElement.style.height = height + 'px';
          el.style.top = (coords.top - height - fontHeight) + 'px';
        }
      }

      if (listViewportOffset.right > doc.clientWidth) {
        el.style.left = (coords.left - listViewportOffset.width) + 'px';
      }

      this.dropdown.nativeElement.style.opacity = 1;
      if (isInputOrTextAreaElement(nativeParentElement)) {
        nativeParentElement.focus();
      }
    }, 0);
  }

  get activeItem() {
    return this.items[this.activeIndex];
  }

  hide() {
    this.dropdown.nativeElement.style.height = this.list.nativeElement.style.height = 'auto';
    this.hidden = true;
  }

  activateItem(index) {
    this.activeIndex = index;
  }

  activateNextItem() {
    // adjust scrollable-menu offset if the next item is out of view
    const listEl: HTMLElement = this.list.nativeElement;
    const activeEl = listEl.getElementsByClassName('active').item(0);
    if (activeEl) {
      const nextLiEl: HTMLElement = <HTMLElement> activeEl.nextSibling;
      if (nextLiEl && nextLiEl.nodeName === 'LI') {
        const nextLiRect: ClientRect = nextLiEl.getBoundingClientRect();
        if (nextLiRect.bottom > listEl.getBoundingClientRect().bottom) {
          listEl.scrollTop = nextLiEl.offsetTop + nextLiRect.height - listEl.clientHeight;
        }
      }
    }
    // select the next item
    this.activeIndex = Math.max(Math.min(this.activeIndex + 1, this.items.length - 1), 0);
  }

  activatePreviousItem() {
    // adjust the scrollable-menu offset if the previous item is out of view
    const listEl: HTMLElement = this.list.nativeElement;
    const activeEl = listEl.getElementsByClassName('active').item(0);
    if (activeEl) {
      const prevLiEl: HTMLElement = <HTMLElement> activeEl.previousSibling;
      if (prevLiEl && prevLiEl.nodeName === 'LI') {
        const prevLiRect: ClientRect = prevLiEl.getBoundingClientRect();
        if (prevLiRect.top < listEl.getBoundingClientRect().top) {
          listEl.scrollTop = prevLiEl.offsetTop;
        }
      }
    }
    // select the previous item
    this.activeIndex = Math.max(Math.min(this.activeIndex - 1, this.items.length - 1), 0);
  }

  resetScroll() {
    this.list.nativeElement.scrollTop = 0;
  }
}
