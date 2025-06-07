/*------ 棋谱代码窗口 ------*/
window.codeboard = (() => {
try {
    "use strict";
    const d = document;
    const dw = d.documentElement.clientWidth;
    const dh = d.documentElement.clientHeight;
    const gridWidth = 980;
    const tempWidth = gridWidth * (dw > dh ? 2 : 1);
    const scale = dw / (dw / dh > 2 ? dw / dh * gridWidth : tempWidth);
    const winWidth = dw / scale;
    const winHeight = dh / scale;
    const ANIMATION_TIMEOUT = 300;
    
    let color = "black";
    let backgroundColor = "#d0d0d0";
    
    const coverArea = document.createElement("div");
    coverArea.ontouch = function() { if (event) event.preventDefault(); };
    
    const codeWindow = document.createElement("div");
    codeWindow.ontouch = function() { if (event) event.preventDefault(); };
    coverArea.appendChild(codeWindow);
    
    const textarea = document.createElement("textarea");
    codeWindow.appendChild(textarea);
    
    function open() {
        document.body.appendChild(coverArea); 
        codeWindow.setAttribute("class", "show");
        Object.assign(coverArea.style, {
            position: "fixed",
            zIndex: 9999,
            width: winWidth + "px",
            height: winHeight * 2 + "px",
            top: "0px",
            left: "0px",
            transformOrigin: `0px 0px`,
            transform: `scale(${scale})`
        })
        const wdWidth = ~~(gridWidth * 3 / 4);
        Object.assign(codeWindow.style, {
            position: "relative",
            width: wdWidth + "px",
            height: wdWidth + "px",
            top: ~~((winHeight / dh * (window.fullscreenUIHeight || document.documentElement.clientHeight) - wdWidth) / 2) + "px",
            left: ~~((winWidth / dw * (window.fullscreenUIWidth || document.documentElement.clientWidth) - wdWidth) / 2) + "px",
            backgroundColor: backgroundColor,
            border: `0px solid `
        })
        const fontSize = ~~(wdWidth / 20);
        const textWidth = ~~(wdWidth - 10 * 2);
        const textHeight = ~~(wdWidth / 2);
        Object.assign(textarea.style, {
            position: "absolute",
            width: textWidth + "px",
            height: textHeight + "px",
            top: 10 + "px",
            left: 10 + "px",
            border: `0px solid black`,
            fontSize: fontSize + "px"
        })
    }

    function close() {
        codeWindow.setAttribute("class", "hide");
        setTimeout(() => {
            coverArea.parentNode.removeChild(coverArea);
        }, ANIMATION_TIMEOUT);
    }
    
    const codeboard = {
        open: async function(codeSte = "") {
            return new Promise(resolve => {
                open()
            })
        }
    }
    return codeboard;
}catch(e){alert(e.message || e.toString())}
})();
