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
      this.mentionListConfig = {listClasses: ''};
    }

    if (!this._itemTemplate) {
      this._itemTemplate = this.defaultItemTemplate;
    }
  }

  // lots of confusion here between relative coordinates and containers
  position(nativeParentElement: HTMLInputElement, iframe: HTMLIFrameElement = null) {
    let coords = {top: 0, left: 0};
    const doc = document.documentElement;
    const caretRelativeToView = getContentEditableCaretCoords({iframe: iframe});
    const parentRelativeToContainer: ClientRect = nativeParentElement.getBoundingClientRect();
    const scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

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

      coords.top = caretRelativeToView.top - parentRelativeToContainer.top + nativeParentElement.offsetTop - scrollTop;
      coords.left = caretRelativeToView.left - parentRelativeToContainer.left + nativeParentElement.offsetLeft - scrollLeft;
    }
    const el: HTMLElement = this._element.nativeElement;
    el.style.position = 'absolute';
    el.style.left = coords.left + 'px';
    el.style.top = coords.top + 'px';

    this.dropdown.nativeElement.style.height = this.list.nativeElement.style.height = 'auto';
    this.dropdown.nativeElement.style.opacity = 0;

    setTimeout( () => {
      const viewportOffset = this.dropdown.nativeElement.getBoundingClientRect();

      if (viewportOffset.bottom > doc.clientHeight) {
        let downHeight = viewportOffset.height - (viewportOffset.bottom - doc.clientHeight);
        let upHeight = viewportOffset.top;

        downHeight = (downHeight > 300 ? 300 : downHeight);
        upHeight = (upHeight > 300 ? 300 : upHeight);

        if (downHeight >= upHeight) {
          this.list.nativeElement.style.height = viewportOffset.height + 'px';
        } else {
          this.list.nativeElement.style.height = viewportOffset.height + 'px';
          el.style.top = (coords.top - viewportOffset.height - 2 * caretRelativeToView.height) + 'px';
        }
      }

      this.dropdown.nativeElement.style.opacity = 1;
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
