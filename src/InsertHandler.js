import CursorHandler from "./CursorHandler.js";

export default function InsertHandler (neonView) {
    var type = "";
    var attributes = null;
    var cursor = new CursorHandler();

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
        else {
            type = "";
            attributes = null;
            console.error("Invalid button for insertion: " + buttonId + ".");
            return;
        }
        $("body").on("click", "#svg_output", handler);
        $("body").on("keydown", (evt) => {
            if (evt.key === "Escape") {
                insertDisabled();
                $("body").off("keydown");
            }
        });
    }

    function insertDisabled () {
        type = "";
        $("body").off("click", "#svg_output", handler);
        $(".insertel.is-active").removeClass("is-active");
        cursor.resetCursor();
    }

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

    InsertHandler.prototype.constructor = InsertHandler;
    InsertHandler.prototype.insertActive = insertActive;
    InsertHandler.prototype.insertDisabled = insertDisabled;
}