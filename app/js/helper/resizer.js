/*global define, window, document, Image, Uint8Array, Blob, HTMLCanvasElement*/
define('helper/resizer', function () {
    "use strict";

    var Resizer = {
        resize: function (imgData, minHeight, callback) {
            var img, blob, ratio1, ratio2, offCanvas, offCanvasContext, finalCanvas, finalCanvasContext;

            // create off-screen canvas
            offCanvas = document.createElement('canvas');
            offCanvasContext = offCanvas.getContext('2d');
            finalCanvas = document.createElement('canvas');
            finalCanvasContext = finalCanvas.getContext('2d');

            minHeight = minHeight > 120 ? minHeight : 120;

            img = new Image();
            blob = new Blob([new Uint8Array(imgData)], { type: "image/png" });
            img.src = window.URL.createObjectURL(blob);

            img.addEventListener("load", function () {
                // compute ratios
                ratio1 = (img.height + minHeight) / (2 * img.height);
                ratio2 = minHeight / (ratio1 * img.height);

                // canvas sizes in 2 steps
                offCanvas.width = Math.round(img.width * ratio1);
                offCanvas.height = Math.round(img.height * ratio1);

                finalCanvas.width = Math.round(offCanvas.width * ratio2);
                finalCanvas.height = Math.round(offCanvas.height * ratio2);

                // step 1 : first resize
                offCanvasContext.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);

                // step 2 : second resize
                offCanvasContext.drawImage(offCanvas, 0, 0, finalCanvas.width, finalCanvas.height);

                // step 3 : crop to final canvas
                finalCanvasContext.drawImage(offCanvas, 0, 0, finalCanvas.width, finalCanvas.height, 0, 0, finalCanvas.width, finalCanvas.height);

                // export to blob/base64
                if (HTMLCanvasElement.prototype.toBlob) {
                    finalCanvas.toBlob(callback);
                } else {
                    callback(finalCanvas.toDataURL('image/png'));
                }
            });
        }
    };

    return Resizer;
});