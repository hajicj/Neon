import * as Cursor from "./Cursor.js";

/**
 * Handle inserting new musical elements and communicate this to Verovio.
 * @constructor
 * @param {NeonView} neonView - The NeonView parent.
 */
function InsertHandler (neonView) {
    var type = "";
    var firstClick = true;
    var coord;
    var attributes = null;

    /**
     * Switch to insert mode based on the button pressed.
     * @param {string} buttonId - The ID of the button pressed.
     */
    function insertActive (buttonId) {
        if (buttonId === "punctum") {
            type = "nc";
            attributes = null;
        }
        else if (buttonId === "diamond") {
            type = "nc";
            attributes = {
                "name": "inclinatum"
            };
        }
        else if (buttonId === "virga") {
            type = "nc";
            attributes = {
                "diagonalright": "u"
            };
        }
        else if (buttonId === "cClef") {
            type = "clef";
            attributes = {
                "shape": "C"
            };
        }
        else if (buttonId === "fClef") {
            type = "clef";
            attributes = {
                "shape": "F"
            };
        }
        else if (buttonId === "custos") {
            type = "custos";
            attributes = null;
        }
        else if (buttonId === "staff") {
            type = "staff";
            attributes = null;
        }
        else {
            type = "";
            attributes = null;
            console.error("Invalid button for insertion: " + buttonId + ".");
            return;
        }
        if (type === "staff") {
            $("body").on("click", "#svg_output", staffHandler);
        }
        else
            $("body").on("click", "#svg_output", handler);
        
        $("body").on("keydown", (evt) => {
            if (evt.key === "Escape") {
                insertDisabled();
                $("body").off("keydown", staffHandler);
                $("body").off("keydown", handler);
            }
        });
    }

    /**
     * Disable insert mode
     */
    function insertDisabled () {
        type = "";
        $("body").off("click", "#svg_output", handler);
        $("body").off("click", "#svg_output", staffHandler);
        $(".insertel.is-active").removeClass("is-active");
        firstClick = true;
        Cursor.resetCursor();
    }

    /**
     * Event handler for insert events other than staff. Creates an insert action and sends it to Verovio.
     * @param {object} evt - JQuery event object.
     */
    function handler (evt) {
        var container = document.getElementsByClassName("definition-scale")[0];
        var pt = container.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        //Transform pt to SVG context
        var transformMatrix = container.getScreenCTM();
        var cursorpt = pt.matrixTransform(transformMatrix.inverse());
        
        let editorAction = {
            "action": "insert",
            "param": {
                "elementType": type,
                "staffId": "auto",
                "ulx": cursorpt.x,
                "uly": cursorpt.y,
            }
        };

        if (attributes !== null) {
            editorAction["param"]["attributes"] = attributes;
        }

        neonView.edit(editorAction);
        neonView.refreshPage();
    }

    /**
     * Event handler for staff insertion. Creates an insert action with two points (ul and lr) and sends it to Verovio.
     * @param {object} evt - JQuery event object.
     */
    function staffHandler (evt) {
        var container = document.getElementsByClassName("definition-scale")[0];
        var pt = container.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        var transformMatrix = container.getScreenCTM();
        var cursorpt = pt.matrixTransform(transformMatrix.inverse());

        if (firstClick) {
            coord = cursorpt;
            firstClick = false;
        }
        else {
            let action = {
                "action": "insert",
                "param": {
                    "elementType": "staff",
                    "staffId": "auto",
                    "ulx": coord.x,
                    "uly": coord.y,
                    "lrx": cursorpt.x,
                    "lry": cursorpt.y,
                }
            };

            neonView.edit(action);
            neonView.refreshPage();
            insertDisabled();
        }
    }

    InsertHandler.prototype.constructor = InsertHandler;
    InsertHandler.prototype.insertActive = insertActive;
    InsertHandler.prototype.insertDisabled = insertDisabled;
}
export {InsertHandler as default};
