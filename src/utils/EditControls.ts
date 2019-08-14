import * as Notification from './Notification';
import NeonView from '../NeonView';
import { navbarDropdownMenu, undoRedoPanel } from './EditContents';
import { convertStaffToSb } from './ConvertMei';

/**
 * prepare the edit mode button
 */
export function prepareEditMode (neonView: NeonView) {
  let parent = document.getElementById('dropdown_toggle');
  let editItem = document.createElement('a');
  editItem.classList.add('navbar-item');
  let editButton = document.createElement('button');
  editButton.classList.add('button');
  editButton.id = 'edit_mode';
  editButton.textContent = 'Edit MEI';
  editItem.appendChild(editButton);
  parent.appendChild(editItem);

  editButton.addEventListener('click', () => {
    startEditMode(neonView);
  });
}

/**
 * start the basic edit mode features
 * is called when the edit mode button is clicked
 */
export function startEditMode (neonView: NeonView) {
  let dropdownToggle = document.getElementById('dropdown_toggle');
  dropdownToggle.innerHTML = navbarDropdownMenu;
  let parent = document.getElementById('dropdown_toggle').parentElement;
  document.getElementById('dropdown_toggle').remove();
  parent.innerHTML = navbarDropdownMenu;
  document.getElementById('undoRedo_controls').innerHTML = undoRedoPanel;
  initNavbar(neonView);
  initUndoRedoPanel(neonView);

  let selectionHighlight = document.createElement('a');
  let divider = document.createElement('hr');
  divider.classList.add('dropdown-divider');
  selectionHighlight.classList.add('dropdown-item');
  selectionHighlight.id = 'highlight-selection';
  selectionHighlight.textContent = 'By Selection Mode';
  (document.getElementsByClassName('dropdown-content'))[0].appendChild(divider);
  (document.getElementsByClassName('dropdown-content'))[0].appendChild(selectionHighlight);
}

/**
 * Set listener on switching EditMode button to File dropdown in the navbar.
 */
export function initNavbar (neonView: NeonView) {
  // setup navbar listeners
  document.getElementById('save').addEventListener('click', () => {
    neonView.save().then(() => {
      Notification.queueNotification('Saved');
    });
  });
  document.body.addEventListener('keydown', (evt) => {
    if (evt.key === 's') {
      neonView.save().then(() => {
        Notification.queueNotification('Saved');
      });
    }
  });

  document.getElementById('export').addEventListener('click', () => {
    neonView.export().then(manifest => {
      let link: HTMLAnchorElement = document.createElement('a');
      link.href = <string>manifest;
      link.download = neonView.name + '.jsonld';
      document.body.appendChild(link);
      link.click();
      link.remove();
      Notification.queueNotification('Saved');
    });
  });

  document.getElementById('revert').addEventListener('click', function () {
    if (window.confirm('Reverting will cause all changes to be lost. Press OK to continue.')) {
      neonView.deleteDb().then(() => {
        window.location.reload();
      });
    }
  });
  // Download link for MEI
  // Is an actual file with a valid URI except in local mode where it must be generated.
  document.getElementById('getmei').addEventListener('click', () => {
    let uri = neonView.view.getCurrentPageURI();
    neonView.getPageMEI(uri).then(mei => {
      let data = 'data:application/mei+xml;base64,' + window.btoa(convertStaffToSb(mei));
      document.getElementById('getmei').setAttribute('href', data);
      document.getElementById('getmei').setAttribute('download', neonView.view.getPageName() + '.mei');
    });
  });
}

/**
 * Initialize the undo/redo panel
 */
export function initUndoRedoPanel (neonView: NeonView) {
  document.getElementById('undo').addEventListener('click', undoHandler);
  document.body.addEventListener('keydown', (evt) => {
    if (evt.key === 'z' && (evt.ctrlKey || evt.metaKey)) {
      undoHandler();
    }
  });

  document.getElementById('redo').addEventListener('click', redoHandler);
  document.body.addEventListener('keydown', (evt) => {
    if ((evt.key === 'Z' || (evt.key === 'z' && evt.shiftKey)) && (evt.ctrlKey || evt.metaKey)) {
      redoHandler();
    }
  });

  /**
   * Tries to undo an action and update the page if it succeeds.
   */
  function undoHandler () {
    neonView.undo().then((result: boolean) => {
      if (result) {
        neonView.updateForCurrentPage();
      } else {
        console.error('Failed to undo action');
      }
    });
  }

  /**
   * Tries to redo an action and update the page if it succeeds.
   */
  function redoHandler () {
    neonView.redo().then((result: boolean) => {
      if (result) {
        neonView.updateForCurrentPage();
      } else {
        console.error('Failed to redo action');
      }
    });
  }
}
