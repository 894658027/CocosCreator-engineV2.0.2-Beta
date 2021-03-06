/****************************************************************************
 Copyright (c) 2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
  worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
  not use Cocos Creator software for developing other software or tools that's
  used for developing games. You are not granted to publish, distribute,
  sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

const debugInfos = require('../../DebugInfos') || {};
const ERROR_MAP_URL = 'https://github.com/cocos-creator/engine/blob/master/EngineErrorMap.md';

// the html element displays log in web page (DebugMode.INFO_FOR_WEB_PAGE)
let logList;

/**
 * @module cc
 */

cc.log = cc.warn = cc.error = cc.assert = console.log;

let resetDebugSetting = function (mode) {
    // reset
    cc.log = cc.warn = cc.error = cc.assert = function () {};

    if (mode === DebugMode.NONE)
        return;

    if (mode > DebugMode.ERROR) {
        //log to web page

        function logToWebPage (msg) {
            if (!cc.game.canvas)
                return;

            if (!logList) {
                var logDiv = document.createElement("Div");
                logDiv.setAttribute("id", "logInfoDiv");
                logDiv.setAttribute("width", "200");
                logDiv.setAttribute("height", cc.game.canvas.height);
                var logDivStyle = logDiv.style;
                logDivStyle.zIndex = "99999";
                logDivStyle.position = "absolute";
                logDivStyle.top = logDivStyle.left = "0";

                logList = document.createElement("textarea");
                logList.setAttribute("rows", "20");
                logList.setAttribute("cols", "30");
                logList.setAttribute("disabled", "true");
                var logListStyle = logList.style;
                logListStyle.backgroundColor = "transparent";
                logListStyle.borderBottom = "1px solid #cccccc";
                logListStyle.borderTopWidth = logListStyle.borderLeftWidth = logListStyle.borderRightWidth = "0px";
                logListStyle.borderTopStyle = logListStyle.borderLeftStyle = logListStyle.borderRightStyle = "none";
                logListStyle.padding = "0px";
                logListStyle.margin = 0;

                logDiv.appendChild(logList);
                cc.game.canvas.parentNode.appendChild(logDiv);
            }

            logList.value = logList.value + msg + "\r\n";
            logList.scrollTop = logList.scrollHeight;
        }

        cc.error = function () {
            logToWebPage("ERROR :  " + cc.js.formatStr.apply(null, arguments));
        };
        cc.assert = function (cond, msg) {
            'use strict';
            if (!cond && msg) {
                msg = cc.js.formatStr.apply(null, cc.js.shiftArguments.apply(null, arguments));
                logToWebPage("ASSERT: " + msg);
            }
        };
        if (mode !== DebugMode.ERROR_FOR_WEB_PAGE) {
            cc.warn = function () {
                logToWebPage("WARN :  " + cc.js.formatStr.apply(null, arguments));
            };
        }
        if (mode === DebugMode.INFO_FOR_WEB_PAGE) {
            cc.log = function () {
                logToWebPage(cc.js.formatStr.apply(null, arguments));
            };
        }
    }
    else if (console && console.log.apply) {//console is null when user doesn't open dev tool on IE9
        //log to console

        // For JSB
        if (!console.error) console.error = console.log;
        if (!console.warn) console.warn = console.log;

        /**
         * !#en
         * Outputs an error message to the Cocos Creator Console (editor) or Web Console (runtime).<br/>
         * - In Cocos Creator, error is red.<br/>
         * - In Chrome, error have a red icon along with red message text.<br/>
         * !#zh
         * ????????????????????? Cocos Creator ???????????? Console ???????????????????????? Console ??????<br/>
         * - ??? Cocos Creator ???????????????????????????????????????<br/>
         * - ??? Chrome ??????????????????????????????????????????????????????????????????<br/>
         *
         * @method error
         * @param {any} msg - A JavaScript string containing zero or more substitution strings.
         * @param {any} ...subst - JavaScript objects with which to replace substitution strings within msg. This gives you additional control over the format of the output.
         */
        if (CC_EDITOR) {
            cc.error = Editor.error;
        }
        else if (console.error.bind) {
            // use bind to avoid pollute call stacks
            cc.error = console.error.bind(console);
        }
        else {
            cc.error = CC_JSB ? console.error : function () {
                return console.error.apply(console, arguments);
            };
        }
        cc.assert = function (cond, msg) {
            if (!cond) {
                if (msg) {
                    msg = cc.js.formatStr.apply(null, cc.js.shiftArguments.apply(null, arguments));
                }
                if (CC_DEV) {
                    debugger;
                }
                if (CC_TEST) {
                    ok(false, msg);
                }
                else {
                    throw new Error(msg);
                }
            }
        }
    }
    if (mode !== DebugMode.ERROR) {
        /**
         * !#en
         * Outputs a warning message to the Cocos Creator Console (editor) or Web Console (runtime).
         * - In Cocos Creator, warning is yellow.
         * - In Chrome, warning have a yellow warning icon with the message text.
         * !#zh
         * ????????????????????? Cocos Creator ???????????? Console ???????????? Web ?????? Console ??????<br/>
         * - ??? Cocos Creator ???????????????????????????????????????<br/>
         * - ??? Chrome ?????????????????????????????????????????????????????????????????????<br/>
         * @method warn
         * @param {any} msg - A JavaScript string containing zero or more substitution strings.
         * @param {any} ...subst - JavaScript objects with which to replace substitution strings within msg. This gives you additional control over the format of the output.
         */
        if (CC_EDITOR) {
            cc.warn = Editor.warn;
        }
        else if (console.warn.bind) {
            // use bind to avoid pollute call stacks
            cc.warn = console.warn.bind(console);
        }
        else {
            cc.warn = CC_JSB ? console.warn : function () {
                return console.warn.apply(console, arguments);
            };
        }
    }
    if (CC_EDITOR) {
        cc.log = Editor.log;
    }
    else if (mode === DebugMode.INFO) {
        /**
         * !#en Outputs a message to the Cocos Creator Console (editor) or Web Console (runtime).
         * !#zh ????????????????????? Cocos Creator ???????????? Console ???????????? Web ?????? Console ??????
         * @method log
         * @param {String|any} msg - A JavaScript string containing zero or more substitution strings.
         * @param {any} ...subst - JavaScript objects with which to replace substitution strings within msg. This gives you additional control over the format of the output.
         */
        if (CC_JSB) {
            if (scriptEngineType === "JavaScriptCore") {
                // console.log has to use `console` as its context for iOS 8~9. Therefore, apply it.
                cc.log = function () {
                    return console.log.apply(console, arguments);
                };
            } else {
                cc.log = console.log;
            }
        }
        else if (console.log.bind) {
            // use bind to avoid pollute call stacks
            cc.log = console.log.bind(console);
        }
        else {
            cc.log = function () {
                return console.log.apply(console, arguments);
            };
        }
    }
};

cc._throw = CC_EDITOR ? Editor.error : function (error) {
    var stack = error.stack;
    if (stack) {
        cc.error(CC_JSB ? (error + '\n' + stack) : stack);
    }
    else {
        cc.error(error);
    }
};

function getTypedFormatter (type) {
    return function () {
        var id = arguments[0];
        var msg = CC_DEBUG ? (debugInfos[id] || 'unknown id') : `${type} ${id}, please go to ${ERROR_MAP_URL}#${id} to see details.`;
        if (arguments.length === 1) {
            return msg;
        }
        else if (arguments.length === 2) {
            return CC_DEBUG ? cc.js.formatStr(msg, arguments[1]) :
                msg + ' Arguments: ' + arguments[1];
        }
        else {
            var argsArray = cc.js.shiftArguments.apply(null, arguments);
            return CC_DEBUG ? cc.js.formatStr.apply(null, [msg].concat(argsArray)) :
                msg + ' Arguments: ' + argsArray.join(', ');
        }
    };
}

var logFormatter = getTypedFormatter('Log');
cc.logID = function () {
    cc.log(logFormatter.apply(null, arguments));
};

var warnFormatter = getTypedFormatter('Warning');
cc.warnID = function () {
    cc.warn(warnFormatter.apply(null, arguments));
};

var errorFormatter = getTypedFormatter('Error');
cc.errorID = function () {
    cc.error(errorFormatter.apply(null, arguments));
};

var assertFormatter = getTypedFormatter('Assert');
cc.assertID = function (cond) {
    'use strict';
    if (cond) {
        return;
    }
    cc.assert(false, assertFormatter.apply(null, cc.js.shiftArguments.apply(null, arguments)));
};

/**
* !#en Enum for debug modes.
* !#zh ????????????
* @enum debug.DebugMode
* @memberof cc
 */
var DebugMode = cc.Enum({
    /**
     * !#en The debug mode none.
     * !#zh ????????????????????????????????????????????????
     * @property NONE
     * @type {Number}
     * @static
     */
    NONE: 0,
    /**
     * !#en The debug mode info.
     * !#zh ?????????????????? console ????????????????????????
     * @property INFO
     * @type {Number}
     * @static
     */
    INFO: 1,
    /**
     * !#en The debug mode warn.
     * !#zh ?????????????????? console ???????????? warn ???????????????????????? error????????????
     * @property WARN
     * @type {Number}
     * @static
     */
    WARN: 2,
    /**
     * !#en The debug mode error.
     * !#zh ?????????????????? console ???????????? error ?????????
     * @property ERROR
     * @type {Number}
     * @static
     */
    ERROR: 3,
    /**
     * !#en The debug mode info for web page.
     * !#zh ?????????????????? WEB ????????????????????????????????????????????????
     * @property INFO_FOR_WEB_PAGE
     * @type {Number}
     * @static
     */
    INFO_FOR_WEB_PAGE: 4,
    /**
     * !#en The debug mode warn for web page.
     * !#zh ?????????????????? WEB ????????????????????????????????? warn ???????????????????????? error????????????
     * @property WARN_FOR_WEB_PAGE
     * @type {Number}
     * @static
     */
    WARN_FOR_WEB_PAGE: 5,
    /**
     * !#en The debug mode error for web page.
     * !#zh ?????????????????? WEB ????????????????????????????????? error ?????????
     * @property ERROR_FOR_WEB_PAGE
     * @type {Number}
     * @static
     */
    ERROR_FOR_WEB_PAGE: 6
});
/**
 * !#en An object to boot the game.
 * !#zh ???????????????????????????????????????????????????????????????
 * @class debug
 * @main
 * @static
 */
module.exports = cc.debug = {
    DebugMode: DebugMode,

    _resetDebugSetting: resetDebugSetting,

    /**
     * !#en Gets error message with the error id and possible parameters.
     * !#zh ?????? error id ??????????????????????????????????????????
     * @method getError
     * @param {id} errorId
     * @param {any} [param]
     * @return {String}
     */
    getError: getTypedFormatter('ERROR'),

    /**
     * !#en Returns whether or not to display the FPS informations.
     * !#zh ???????????? FPS ?????????
     * @method isDisplayStats
     * @return {Boolean}
     */
    isDisplayStats: function () {
        return cc.profiler ? cc.profiler.isShowingStats() : false;
    },

    /**
     * !#en Sets whether display the FPS on the bottom-left corner.
     * !#zh ?????????????????????????????? FPS???
     * @method setDisplayStats
     * @param {Boolean} displayStats
     */
    setDisplayStats: function (displayStats) {
        if (cc.profiler) {
            displayStats ? cc.profiler.showStats() : cc.profiler.hideStats();
            cc.game.config.showFPS = !!displayStats;
        }
    },
}