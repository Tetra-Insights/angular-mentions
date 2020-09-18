import {Component, ViewChild} from '@angular/core';

import { COMMON_NAMES } from './common-names';
import { COMMON_TAGS } from './common-tags'
import {MentionDirective} from '../mention';

/**
 * Demo app showing usage of the mentions directive.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  items: string[] = COMMON_NAMES;
  tagsItems: string[] = COMMON_TAGS;

  @ViewChild('mentionWithAddCharButton') mentionWithAddCharButton: MentionDirective;

  onMentionHide() {
    console.log('hide');
  }

  onMentionVisible() {
    console.log('visible');
  }

  insertAtCaret(id, text) {
    const myField: any = document.getElementById(id);
    setTimeout(() => {
      const _document: any = document;

      if (_document.selection) {
        myField.focus();
        const sel = _document.selection.createRange();
        sel.text = text;
      } else {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const startPos = range.startOffset;
        const endPos = range.endOffset;
        myField.innerText = myField.innerText.substring(0, startPos)
          + text
          + myField.innerText.substring(endPos, myField.innerText.length);

        this.setCaret(myField, startPos + text.length);
      }
    }, 10);
  }

  setCaret(el, offset) {
    const range = document.createRange();
    const sel = window.getSelection();

    range.setStart(el.childNodes[0], offset);
    range.collapse(true);

    sel.removeAllRanges();
    sel.addRange(range);
  }

  onOpenTagsDropdown($event) {
    $event.preventDefault();

    this.mentionWithAddCharButton.keyHandler(new KeyboardEvent('keydown', {key: '#'}));
    this.insertAtCaret('ce-add-char-functionality', '#');
  }

}
