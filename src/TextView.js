import * as Notification from './utils/Notification.js';

/** @module TextView */

const $ = require('jquery');

/*
 * Class that manages getting the text for syllables in Neon from the mei file
 */
class TextView {
  /**
   * A constructor for a TextView.
   * @param {NeonView} neonView = The NeonView parent.
   */

  constructor (neonView) {
    this.neonView = neonView;
    this.notificationSent = false;

    // add checkbox to enable/disable the view
    let block = document.getElementById('extensible-block');
    let label = document.createElement('label');
    let label2 = document.createElement('label');
    let input = document.createElement('input');
    let input2 = document.createElement('input');
    label.classList.add('checkbox');
    label2.classList.add('checkbox');
    label.textContent = 'Display Text: ';
    label2.textContent = 'Display Text BBoxes: ';
    input.classList.add('checkbox');
    input2.classList.add('checkbox');
    input.id = 'displayText';
    input.type = 'checkbox';
    input2.id = 'displayBBox';
    input2.type = 'checkbox';
    input.checked = false;
    input2.checked = false;
    label.appendChild(input);
    label2.appendChild(input2);
    block.prepend(label2);
    block.prepend(label);

    this.setTextViewControls();
    this.neonView.view.addUpdateCallback(this.updateTextViewVisibility.bind(this));
  }

  /**
  * set listeners on textview visibility checkbox
  */
  setTextViewControls () {
    this.updateTextViewVisibility();
    this.updateBboxViewVisibility();
    $('#displayText').on('click', () => {
      this.updateTextViewVisibility();
    });
    $('#displayBBox').on('click', () => {
      this.updateBboxViewVisibility();
    });
  }

  /**
   * update visibility of text boundinb boxes
   */
  updateBboxViewVisibility () {
    if ($('#displayBBox').is(':checked')) {
      $('.sylTextRect').addClass('sylTextRect-display');
      $('.sylTextRect').removeClass('sylTextRect');
    } else {
      $('.sylTextRect-display').addClass('sylTextRect');
      $('.sylTextRect-display').removeClass('sylTextRect-display');
    }
  }

  /**
  * update the visibility of the textview box
  * and add the event listeners to make sure the syl highlights when moused over
  */
  updateTextViewVisibility () {
    if ($('#displayText').is(':checked')) {
      $('#syl_text').css('display', '');
      $('#syl_text').html('<p>' + this.getSylText() + '</p>');
      let spans = Array.from($('#syl_text').children('p').children('span'));
      spans.forEach(span => {
        let syllable = $('#' + $(span).attr('class'));
        let syl = syllable.children('.syl');
        let text = syl.children('text');
        let rect = syl.children('rect');
        if (text.attr('class') == null) {
          text.addClass('text');
        }
        $(span).on('mouseenter', () => {
          syllable.addClass('syl-select');
          rect.removeClass('sylTextRect-display');
          rect.addClass('sylTextRect-select');
          // syl.attr('fill', '#ffc7c7');
          // this.highlightBoundingBox(span);
        });
        $(span).on('mouseleave', () => {
          syllable.removeClass('syl-select');
          rect.removeClass('sylTextRect-select');
          rect.addClass('sylTextRect-display');
          // syl.attr('fill', null);
          // this.removeBoundingBox(span);
        });
      });
      if (this.neonView.getUserMode() !== 'viewer' && this.neonView.TextEdit !== undefined) {
        this.neonView.TextEdit.setTextEdit();
      }
    } else {
      $('#syl_text').css('display', 'none');
    }
  }

  /**
   * Get the syllable text of the loaded file
   * @returns {string}
   */
  getSylText () {
    var lyrics = '';
    let uniToDash = /\ue551/g;
    let syllables = Array.from($('.active-page .syllable'));
    syllables.forEach(syllable => {
      if ($(syllable).has('.syl').length) {
        let syl = $(syllable).children('.syl')[0];
        lyrics += "<span class='" + syllable.id + "'>";
        if (syl.textContent.trim() === '') {
          lyrics += '&#x25CA; ';
        } else {
          Array.from(syl.children[0].children[0].children).forEach(text => {
            lyrics += text.textContent !== '' ? text.textContent : '&#x25CA; ';
          });
        }
        lyrics += ' </span>';
      } else {
        lyrics += "<span class='" + syllable.id + "'>&#x25CA; </span>";
      }
    });
    if (!TextView.notificationSent) {
      Notification.queueNotification('Blank syllables are represented by &#x25CA;!');
      TextView.notificationSent = true;
    }
    return lyrics.replace(uniToDash, '-');
  }
}

export { TextView as default };
