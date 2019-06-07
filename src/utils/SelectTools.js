/** @module UnifiedEdit/SelectTools */

import * as Color from './Color.js';
import { updateHighlight } from '../DisplayPanel/DisplayControls.js';
import * as Grouping from '../SquareEdit/Grouping.js';
import { Resize } from './Resize.js';
import * as SelectOptions from '../utils/SelectOptions.js';

const d3 = require('d3');
const $ = require('jquery');

/**
 * Unselect all selected elements and run undo any extra
 * actions.
 */
export function unselect () {
  var selected = $('.selected');
  for (var i = 0; i < selected.length; i++) {
    if ($(selected[i]).hasClass('staff')) {
      $(selected[i]).removeClass('selected');
      Color.unhighlight(selected[i]);
    } else {
      $(selected[i]).removeClass('selected').attr('fill', null);
    }
  }
  $('.syl-select').css('color', '');
  $('.syl-select').css('font-weight', '');
  $('.syl-select').removeClass('syl-select');

  $('.sylTextRect-select').addClass('sylTextRect');
  $('.sylTextRect-select').removeClass('sylTextRect-select');

  d3.select('#resizeRect').remove();

  if (!$('#selByStaff').hasClass('is-active')) {
    Grouping.endGroupingSelection();
  } else {
    SelectOptions.endOptionsSelection();
  }
  updateHighlight();
}

/**
 * Generic select function.
 * @param {SVGGraphicsElement} el
 */
export function select (el) {
  if (!$(el).hasClass('selected')) {
    $(el).attr('fill', '#d00');
    $(el).addClass('selected');

    var sylId;
    if ($(el).hasClass('syllable')) {
      sylId = el.id;
    } else if ($(el).parents('.syllable').length) {
      sylId = $(el).parents('.syllable').attr('id');
    }
    if (sylId !== undefined) {
      if ($('span').filter('.' + sylId).length) {
        $('span').filter('.' + sylId).css('color', '#d00');
        $('span').filter('.' + sylId).css('font-weight', 'bold');
        $('span').filter('.' + sylId).addClass('syl-select');
      }
    }
  }
  updateHighlight();
}

/**
 * Select an nc.
 * @param {SVGGraphicsElement} el - The nc element to select.
 * @param {DragHandler} dragHandler - An instantiated DragHandler.
 * @param {NeonView} neonView - The NeonView parent
 */
export async function selectNcs (el, neonView, dragHandler) {
  if (!$(el).parent().hasClass('selected')) {
    var parent = el.parentNode;
    unselect();
    select(parent);
    if (await isLigature(parent, neonView)) {
      var prevNc = $(parent).prev()[0];
      if (await isLigature(prevNc, neonView)) {
        select(prevNc);
      } else {
        var nextNc = $(parent).next()[0];
        if (await isLigature(nextNc, neonView)) {
          select(nextNc);
        } else {
          console.warn('Error: Neither prev or next nc are ligatures');
        }
      }
      Grouping.triggerGrouping('ligature');
    } else if ($(parent).hasClass('nc')) {
      SelectOptions.triggerNcActions(parent);
    } else {
      console.warn('No action triggered!');
    }
    dragHandler.dragInit();
  }
}

/**
 * Check if neume component is part of a ligature
 * @param {SVGGraphicsElement} nc - The neume component to check.
 * @returns {boolean}
 */
export async function isLigature (nc, neonView) {
  var attributes = await neonView.getElementAttr(nc.id, neonView.view.getCurrentPage());
  return (attributes.ligated === 'true');
}

/**
 * Check if the elements have the same parent up two levels.
 * @param {Array<Element>} elements - The array of elements.
 * @returns {boolean} - If the elements share the same second level parent.
 */
export function sharedSecondLevelParent (elements) {
  let firstElement = elements.pop();
  let secondParent = firstElement.parentElement.parentElement;
  for (let element of elements) {
    let secPar = element.parentElement.parentElement;
    if (secPar.id !== secondParent.id) {
      return false;
    }
  }
  return true;
}

/**
 * Get the bounding box of a staff based on its staff lines.
 * @param {SVGGElement} staff
 * @returns {object}
 */
export function getStaffBBox (staff) {
  let ulx, uly, lrx, lry;
  Array.from($(staff).children('path')).forEach(path => {
    let box = path.getBBox();
    if (uly === undefined || box.y < uly) {
      uly = box.y;
    }
    if (ulx === undefined || box.x < ulx) {
      ulx = box.x;
    }
    if (lry === undefined || box.y + box.height > lry) {
      lry = box.y + box.height;
    }
    if (lrx === undefined || box.x + box.width > lrx) {
      lrx = box.x + box.width;
    }
  });
  return { 'ulx': ulx, 'uly': uly, 'lrx': lrx, 'lry': lry };
}

/**
 * select a boundingbox element
 * @param {SVGGElement} el - the bbox (sylTextRect) element in the DOM
 * @param {DragHandler} dragHandler - the drag handler in use
 */
 export function selectBBox (el, dragHandler) {

  //-------this method is preliminary and will need to be fixed later---------------------

  let bbox = $(el);
  if (!bbox.hasClass('sylTextRect-select')) {
    unselect();
    bbox.removeClass('sylTextRect');
    bbox.addClass('sylTextRect-select');
    updateHighlight();
    dragHandler.dragInit();
  }
 } 

/**
 * Select not neume elements.
 * @param {SVGGraphicsElement[]} notNeumes - An array of not neumes elements.
 */
export function selectNn (notNeumes) {
  if (notNeumes.length > 0) {
    notNeumes.forEach(nn => { select(nn); });
    return false;
  } else {
    return true;
  }
}

/**
 * Select a staff element.
 * @param {SVGGElement} el - The staff element in the DOM.
 * @param {DragHandler} dragHandler - The drag handler in use.
 */
export function selectStaff (el, dragHandler) {
  let staff = $(el);
  if (!staff.hasClass('selected')) {
    unselect();
    staff.addClass('selected');
    updateHighlight();
    Color.highlight(el, '#d00');
    dragHandler.dragInit();
  }
}

/**
 * Handle selecting an array of elements based on the selection type.
 * @param {SVGGraphicsElement[]} elements - The elements to select. Either <g> or <use>.
 */
export async function selectAll (elements, neonView, info, dragHandler) {
  var syls = [];

  var neumes = [];

  var ncs = [];

  var notNeumes = [];

  elements.forEach(el => {
    var firstParent = el.parentNode;

    if ($(firstParent).hasClass('nc')) {
      ncs.push(firstParent);

      let neume = firstParent.parentNode;
      if (!neumes.includes(neume)) {
        neumes.push(neume);
      }

      var syl = neume.parentNode;
      if (!syls.includes(syl)) {
        syls.push(syl);
      }
    } else {
      notNeumes.push(firstParent);
    }
  });

  // Determine selection mode
  var selectMode = null;
  Array.from($('.sel-by')).forEach(tab => {
    if ($(tab).hasClass('is-active')) {
      selectMode = $(tab)[0].id;
    }
  });

  if (selectMode === 'selByStaff') {
    let toSelect = [];
    elements.forEach(el => {
      if (el.tagName === 'use') {
        let staff = $(el).parents('.staff')[0];
        if (!toSelect.includes(staff)) {
          toSelect.push(staff);
        }
      } else {
        if (!toSelect.includes(el)) {
          toSelect.push(el);
        }
      }
    });
    toSelect.forEach(elem => {
      $(elem).addClass('selected');
    });

    updateHighlight();
    toSelect.forEach(elem => {
      Color.highlight(elem, '#d00');
    });
    if (toSelect.length === 1) {
      SelectOptions.triggerSplitActions();
      let resize = new Resize(toSelect[0].id, neonView, dragHandler);
      resize.drawInitialRect();
    } else if (toSelect.length === 2) {
      let bb1 = getStaffBBox(toSelect[0]);
      let bb2 = getStaffBBox(toSelect[1]);
      var avgHeight = (bb1.lry - bb1.uly + bb2.lry - bb2.uly) / 2;
      if (Math.abs(bb1.uly - bb2.uly) < avgHeight) {
        SelectOptions.triggerStaffActions();
      }
    }
  } else if (selectMode === 'selBySyl') {
    let noClefOrCustos = selectNn(notNeumes);
    syls.forEach(s => { select(s); });
    if (!noClefOrCustos) {
      if (notNeumes.length === 1 && ncs.length === 0) {
        let el = notNeumes[0];
        // if ($(el).hasClass("custos")){
        //     SelectOptions.triggerNcActions([el]);
        // }
        if ($(el).hasClass('clef')) {
          SelectOptions.triggerClefActions(el);
        }
      }
    } else if (syls.length > 1) {
      if (sharedSecondLevelParent(syls)) {
        Grouping.triggerGrouping('syl');
      }
    } else if (syls.length === 1) {
      var syl = syls[0];
      var nmChildren = $(syl).children('.neume');
      if (nmChildren.length === 1) {
        let neume = nmChildren[0];
        let ncChildren = neume.children;
        if (ncChildren.length === 1) {
          unselect();
          select(ncChildren[0]);
          SelectOptions.triggerNcActions(ncChildren[0]);
        } else if (ncChildren.length === 2) {
          unselect();
          if (await isLigature(ncChildren[0], neonView)) {
            selectNcs(ncChildren[0], neonView, dragHandler);
            if (sharedSecondLevelParent(Array.from(document.getElementsByClassName('selected')))) {
              Grouping.triggerGrouping('ligature');
            }
          } else {
            select(neume);
            SelectOptions.triggerNeumeActions();
          }
        } else {
          unselect();
          select(neume);
          SelectOptions.triggerNeumeActions();
        }
      } else {
        SelectOptions.triggerSylActions();
      }
    }
  } else if (selectMode === 'selByNeume') {
    unselect();
    let noClefOrCustos = selectNn(notNeumes);
    neumes.forEach(n => { select(n); });
    if (!noClefOrCustos) {
      if (notNeumes.length === 1 && ncs.length === 0) {
        let el = notNeumes[0];
        // if ($(el).hasClass("custos")){
        //     SelectOptions.triggerNcActions([el]);
        // }
        if ($(el).hasClass('clef')) {
          SelectOptions.triggerClefActions(el);
        }
      }
    } else if (neumes.length > 1) {
      let syllable = neumes[0].parentElement;
      let group = false;
      for (var i = 1; i < neumes.length; i++) {
        if (syllable !== neumes[i].parentElement) {
          group = true;
          break;
        }
      }
      if (group) {
        if (sharedSecondLevelParent(neumes)) {
          Grouping.triggerGrouping('neume');
        }
      } else {
        let sylNeumes = Array.from(syllable.children).filter(child => $(child).hasClass('neume'));
        let result = true;
        sylNeumes.forEach(neume => { result = result && neumes.includes(neume); });
        if (result) {
          unselect();
          select(syllable);
          SelectOptions.triggerSylActions();
        }
      }
    } else if (neumes.length === 1) {
      let neume = neumes[0];
      let ncChildren = neume.children;
      if (ncChildren.length === 1) {
        unselect();
        select(ncChildren[0]);
        SelectOptions.triggerNcActions(ncChildren[0]);
      } else if (ncChildren.length === 2 && await isLigature(ncChildren[0], neonView)) {
        unselect();
        select(ncChildren[0]);
        select(ncChildren[1]);
        Grouping.triggerGrouping('ligature');
      } else {
        SelectOptions.triggerNeumeActions();
      }
    }
  } else if (selectMode === 'selByNc') {
    let noClefOrCustos = selectNn(notNeumes);
    if (ncs.length === 1 && noClefOrCustos) {
      selectNcs(ncs[0].children[0], neonView, dragHandler);
      return;
    }
    var prev = $(ncs[0]).prev();
    if (ncs.length !== 0 && await isLigature(ncs[0], neonView) && prev.length !== 0 && await isLigature($(ncs[0]).prev()[0], neonView)) {
      ncs.push($(ncs[0]).prev()[0]);
    }
    ncs.forEach(nc => { select(nc); });
    if (!noClefOrCustos) {
      if (notNeumes.length === 1 && ncs.length === 0) {
        var el = notNeumes[0];
        // if ($(el).hasClass("custos")){
        //     SelectOptions.triggerNcActions([el]);
        // }
        if ($(el).hasClass('clef')) {
          SelectOptions.triggerClefActions(el);
        }
      }
    } else if (ncs.length === 2) {
      let firstChild = ncs[0].children[0];
      let secondChild = ncs[1].children[0];
      var firstX = firstChild.x.baseVal.value; // $(ncs[0]).children()[0].x.baseVal.value;
      var secondX = secondChild.x.baseVal.value; // $(ncs[1]).children()[0].x.baseVal.value;
      var firstY = 0;
      var secondY = 0;

      if (firstX === secondX) {
        firstY = secondChild.y.baseVal.value;
        secondY = firstChild.y.baseVal.value;
      } else {
        firstY = firstChild.y.baseVal.value;
        secondY = secondChild.y.baseVal.value;
      }

      if (secondY > firstY) {
        if (ncs[0].parentNode.id === ncs[1].parentNode.id) {
          let isFirstLigature = await isLigature(ncs[0], neonView);
          let isSecondLigature = await isLigature(ncs[1], neonView);
          if ((isFirstLigature && isSecondLigature) || (!isFirstLigature && !isSecondLigature)) {
            Grouping.triggerGrouping('ligature');
          }
          /* else{
                        Grouping.triggerGrouping("ligatureNc");
                    } */
        } else {
          if (ncs[0].parentElement !== ncs[1].parentElement) {
            if (sharedSecondLevelParent(ncs)) {
              Grouping.triggerGrouping('nc');
            }
          }
        }
      } else {
        if (ncs[0].parentElement !== ncs[1].parentElement) {
          if (sharedSecondLevelParent(ncs)) {
            Grouping.triggerGrouping('nc');
          }
        }
      }
    } else if (ncs.length > 1 && noClefOrCustos) {
      let neume = ncs[0].parentElement;
      let group = false;
      for (i = 1; i < ncs.length; i++) {
        if (ncs[i].parentElement !== neume) {
          group = true;
          break;
        }
      }
      if (group) {
        if (sharedSecondLevelParent(ncs)) {
          Grouping.triggerGrouping('nc');
        }
      } else {
        let neumeNcs = Array.from(neume.children).filter(nc => $(nc).hasClass('nc'));
        let result = true;
        neumeNcs.forEach(nc => { result = result && ncs.includes(nc); });
        if (result) {
          unselect();
          select(neume);
          SelectOptions.triggerNeumeActions();
        }
      }
    } else if (ncs.length === 1) {
      SelectOptions.triggerNcActions(ncs[0]);
    }
  }
  if ($('.selected').length > 0) {
    info.stopListeners();
  }
  if (dragHandler !== undefined) {
    dragHandler.dragInit();
  }
}
