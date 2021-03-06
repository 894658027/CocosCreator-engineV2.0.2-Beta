/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

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

const macro = require('../../platform/CCMacro');
const EditBoxImpl = require('../editbox/CCEditBoxImpl');
const Label = require('../CCLabel');
const Types = require('./types');
const InputMode = Types.InputMode;
const InputFlag = Types.InputFlag;
const KeyboardReturnType = Types.KeyboardReturnType;

const LEFT_PADDING = 2;

function capitalize (string) {
    return string.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

function capitalizeFirstLetter (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


/**
 * !#en cc.EditBox is a component for inputing text, you can use it to gather small amounts of text from users.
 * !#zh EditBox ?????????????????????????????????????????????
 * @class EditBox
 * @extends Component
 */
let EditBox = cc.Class({
    name: 'cc.EditBox',
    extends: cc.Component,

    editor: CC_EDITOR && {
        menu: 'i18n:MAIN_MENU.component.ui/EditBox',
        inspector: 'packages://inspector/inspectors/comps/cceditbox.js',
        help: 'i18n:COMPONENT.help_url.editbox',
        executeInEditMode: true,
    },

    properties: {
        _useOriginalSize: true,
        _string: '',
        /**
         * !#en Input string of EditBox.
         * !#zh ??????????????????????????????????????????????????????????????????????????????
         * @property {String} string
         */
        string: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.string',
            get () {
                return this._string;
            },
            set(value) {
                if (this.maxLength >= 0 && value.length >= this.maxLength) {
                    value = value.slice(0, this.maxLength);
                }

                this._string = value;
                if (this._impl) {
                    this._updateString(value);
                }
            }
        },

        /**
         * !#en The background image of EditBox.
         * !#zh ????????????????????????
         * @property {SpriteFrame} backgroundImage
         */
        backgroundImage: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.backgroundImage',
            default: null,
            type: cc.SpriteFrame,
            notify () {
                this._createBackgroundSprite();
            }
        },

        /**
         * !#en
         * The return key type of EditBox.
         * Note: it is meaningless for web platforms and desktop platforms.
         * !#zh
         * ????????????????????????????????????????????????
         * ???????????????????????? web ????????? desktop ???????????????
         * @property {EditBox.KeyboardReturnType} returnType
         * @default KeyboardReturnType.DEFAULT
         */
        returnType: {
            default: KeyboardReturnType.DEFAULT,
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.returnType',
            displayName: 'KeyboardReturnType',
            type: KeyboardReturnType,
            notify () {
                if (this._impl) {
                    this._impl.returnType = this.returnType;
                }
            }
        },

        /**
         * !#en Set the input flags that are to be applied to the EditBox.
         * !#zh ???????????????????????????????????????????????????????????????????????????????????????
         * @property {EditBox.InputFlag} inputFlag
         * @default InputFlag.DEFAULT
         */
        inputFlag: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.input_flag',
            default: InputFlag.DEFAULT,
            type: InputFlag,
            notify () {
                if (this._impl) {
                    this._impl.setInputFlag(this.inputFlag);
                    this._updateString(this._string);
                }
            }
        },
        /**
         * !#en
         * Set the input mode of the edit box.
         * If you pass ANY, it will create a multiline EditBox.
         * !#zh
         * ??????????????????: ANY?????????????????????????????????????????????????????????????????????????????????????????????
         * @property {EditBox.InputMode} inputMode
         * @default InputMode.ANY
         */
        inputMode: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.input_mode',
            default: InputMode.ANY,
            type: InputMode,
            notify () {
                if (this._impl) {
                    this._impl.setInputMode(this.inputMode);
                }
            }
        },

        /**
         * !#en Font size of the input text.
         * !#zh ??????????????????????????????
         * @property {Number} fontSize
         */
        fontSize: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.font_size',
            default: 20,
            notify () {
                if (this._textLabel) {
                    this._textLabel.fontSize = this.fontSize;
                }
                if (this._impl) {
                    this._impl.setFontSize(this.fontSize);
                }
            }
        },

        /**
         * !#en Change the lineHeight of displayed text.
         * !#zh ???????????????????????????
         * @property {Number} lineHeight
         */
        lineHeight: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.line_height',
            default: 40,
            notify () {
                if (this._textLabel) {
                    this._textLabel.lineHeight = this.lineHeight;
                }
            }
        },

        /**
         * !#en Font color of the input text.
         * !#zh ???????????????????????????
         * @property {Color} fontColor
         */
        fontColor: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.font_color',
            default: cc.Color.WHITE,
            notify () {
                if (this._textLabel) {
                    this._textLabel.node.opacity = this.fontColor.a;
                    this._textLabel.node.color = this.fontColor;
                }
                if (this._impl) {
                    this._impl.setFontColor(this.fontColor);
                }
            }
        },

        /**
         * !#en The display text of placeholder.
         * !#zh ????????????????????????????????????
         * @property {String} placeholder
         */
        placeholder: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.placeholder',
            default: 'Enter text here...',
            notify () {
                if (this._placeholderLabel) {
                    this._placeholderLabel.string = this.placeholder;
                }
                if (this._impl) {
                    this._impl.setPlaceholderText(this.placeholder);
                }
            }
        },

        /**
         * !#en The font size of placeholder.
         * !#zh ????????????????????????????????????
         * @property {Number} placeholderFontSize
         */
        placeholderFontSize: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.placeholder_font_size',
            default: 20,
            notify () {
                if (this._placeholderLabel) {
                    this._placeholderLabel.fontSize = this.placeholderFontSize;
                }
            }
        },

        /**
         * !#en The font color of placeholder.
         * !#zh ????????????????????????????????????
         * @property {Color} placeholderFontColor
         */
        placeholderFontColor: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.placeholder_font_color',
            default: cc.Color.GRAY,
            notify () {
                if (this._placeholderLabel) {
                    this._placeholderLabel.node.color = this.placeholderFontColor;
                    this._placeholderLabel.node.opacity = this.placeholderFontColor.a;
                }
            }
        },

        /**
         * !#en The maximize input length of EditBox.
         * - If pass a value less than 0, it won't limit the input number of characters.
         * - If pass 0, it doesn't allow input any characters.
         * !#zh ?????????????????????????????????????????????
         * - ?????????????????? 0 ?????????????????????????????????????????????
         * - ???????????? 0??????????????????????????????????????????
         * @property {Number} maxLength
         */
        maxLength: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.max_length',
            default: 20,
            notify () {
                if (this._impl) {
                    this._impl.setMaxLength(this.maxLength);
                }
            }
        },

        /**
         * !#en The input is always visible and be on top of the game view (only useful on Web).
         * !zh ???????????????????????????????????????????????????????????????????????????????????? Web ????????????????????????
         * Note: only available on Web at the moment.
         * @property {Boolean} stayOnTop
         */
        stayOnTop: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.stay_on_top',
            default: false,
            notify () {
                if (this._impl) {
                    this._updateStayOnTop();
                }
            }
        },

        _tabIndex: 0,

        /**
         * !#en Set the tabIndex of the DOM input element (only useful on Web).
         * !#zh ?????? DOM ??????????????? tabIndex???????????????????????? Web ???????????????????????????
         * @property {Number} tabIndex
         */
        tabIndex: {
            tooltip: CC_DEV && 'i18n:COMPONENT.editbox.tab_index',
            get () {
                return this._tabIndex;
            },
            set (value) {
                this._tabIndex = value;
                if (this._impl) {
                    this._impl.setTabIndex(value);
                }
            }
        },

        /**
         * !#en The event handler to be called when EditBox began to edit text.
         * !#zh ???????????????????????????????????????????????????
         * @property {Component.EventHandler[]} editingDidBegan
         */
        editingDidBegan: {
            default: [],
            type: cc.Component.EventHandler,
        },

        /**
         * !#en The event handler to be called when EditBox text changes.
         * !#zh ????????????????????????????????????????????????
         * @property {Component.EventHandler[]} textChanged
         */
        textChanged: {
            default: [],
            type: cc.Component.EventHandler,
        },

        /**
         * !#en The event handler to be called when EditBox edit ends.
         * !#zh ??????????????????????????????????????????????????????
         * @property {Component.EventHandler[]} editingDidEnded
         */
        editingDidEnded: {
            default: [],
            type: cc.Component.EventHandler,
        },

        /**
         * !#en The event handler to be called when return key is pressed. Windows is not supported.
         * !#zh ??????????????????????????????????????????????????????????????? windows ??????
         * @property {Component.EventHandler[]} editingReturn
         */
        editingReturn: {
            default: [],
            type: cc.Component.EventHandler
        }

    },

    statics: {
        _EditBoxImpl: EditBoxImpl,
        KeyboardReturnType: KeyboardReturnType,
        InputFlag: InputFlag,
        InputMode: InputMode
    },

    _init () {
        this._createBackgroundSprite();
        this._createLabels();
        this.node.on(cc.Node.EventType.SIZE_CHANGED, this._resizeChildNodes, this);

        let impl = this._impl = new EditBoxImpl();

        impl.setDelegate(this);
        impl.setNode(this.node);
        impl.setInputMode(this.inputMode);
        impl.setMaxLength(this.maxLength);
        impl.setInputFlag(this.inputFlag);
        impl.setReturnType(this.returnType);
        impl.setTabIndex(this.tabIndex);
        impl.setFontColor(this.fontColor);
        impl.setFontSize(this.fontSize);
        impl.setPlaceholderText(this.placeholder);

        this._updateStayOnTop();
        this._updateString(this.string);
        this._syncSize();
    },

    _updateStayOnTop () {
        if (this.stayOnTop) {
            this._hideLabels();
        }
        else {
            this._showLabels();
        }
        this._impl.stayOnTop(this.stayOnTop);
    },

    _syncSize () {
        let size = this.node.getContentSize();
        
        this._background.node.setAnchorPoint(this.node.getAnchorPoint());
        this._background.node.setContentSize(size);

        this._updateLabelPosition(size);
        this._impl.setSize(size.width, size.height);
    },

    _updateLabelPosition (size) {
        let node = this.node;
        let offx = -node.anchorX * node.width;
        let offy = -node.anchorY * node.height;

        let placeholderLabel = this._placeholderLabel;
        let textLabel = this._textLabel;

        textLabel.node.setContentSize(size.width - LEFT_PADDING, size.height);
        placeholderLabel.node.setContentSize(size.width - LEFT_PADDING, size.height);
        placeholderLabel.lineHeight = size.height;

        placeholderLabel.node.setPosition(offx + LEFT_PADDING, offy + size.height);
        textLabel.node.setPosition(offx + LEFT_PADDING, offy + size.height);

        if (this.inputMode === InputMode.ANY){
            placeholderLabel.verticalAlign = macro.VerticalTextAlignment.TOP;
            placeholderLabel.enableWrapText = true;
            textLabel.verticalAlign = macro.VerticalTextAlignment.TOP;
            textLabel.enableWrapText = true;
        }
        else {
            placeholderLabel.verticalAlign = macro.VerticalTextAlignment.CENTER;
            placeholderLabel.enableWrapText = false;
            textLabel.verticalAlign = macro.VerticalTextAlignment.CENTER;
            textLabel.enableWrapText = false;
        }
    },

    _createBackgroundSprite () {
        let background = this._background;
        if (!background) {
            let node = this.node.getChildByName('BACKGROUND_SPRITE');
            if (!node) {
                node = new cc.Node('BACKGROUND_SPRITE');
            }
            
            background = node.getComponent(cc.Sprite);
            if (!background) {
                background = node.addComponent(cc.Sprite);
            }
            background.type = cc.Sprite.Type.SLICED;

            node.parent = this.node;
            this._background = background;
        }
        background.spriteFrame = this.backgroundImage;
    },

    _createLabels () {
        if (!this._textLabel) {
            let node = this.node.getChildByName('TEXT_LABEL');
            if (!node) {
                node = new cc.Node('TEXT_LABEL');
            }
            node.color = this.fontColor;
            node.parent = this.node;
            node.setAnchorPoint(0, 1);

            let textLabel = node.getComponent(Label);
            if (!textLabel) {
                textLabel = node.addComponent(Label);
            }
            textLabel.overflow = Label.Overflow.CLAMP;
            textLabel.fontSize = this.fontSize;
            textLabel.lineHeight = this.lineHeight;
            this._textLabel = textLabel;
        }

        if (!this._placeholderLabel) {
            let node = this.node.getChildByName('PLACEHOLDER_LABEL');
            if (!node) {
                node = new cc.Node('PLACEHOLDER_LABEL');
            }
            node.color = this.placeholderFontColor;
            node.parent = this.node;
            node.setAnchorPoint(0, 1);

            let placeholderLabel = node.getComponent(Label);
            if (!placeholderLabel) {
                placeholderLabel = node.addComponent(Label);
            }
            placeholderLabel.overflow = Label.Overflow.CLAMP;
            placeholderLabel.fontSize = this.placeholderFontSize;
            placeholderLabel.string = this.placeholder;
            this._placeholderLabel = placeholderLabel;
        }
    },

    _resizeChildNodes () {
        let textLabelNode = this._textLabel.node,
            placeholderLabelNode = this._placeholderLabel.node,
            backgroundNode = this._background.node;
            
        textLabelNode.x = -this.node.width/2;
        textLabelNode.y = this.node.height/2;
        textLabelNode.width = this.node.width;
        textLabelNode.height = this.node.height;
        
        placeholderLabelNode.x = -this.node.width/2;
        placeholderLabelNode.y = this.node.height/2;
        placeholderLabelNode.width = this.node.width;
        placeholderLabelNode.height = this.node.height;            
        
        backgroundNode.width = this.node.width;
        backgroundNode.height = this.node.height;
    },

    _showLabels () {
        let displayText = this._textLabel.string;
        this._textLabel.node.active = displayText !== '';
        this._placeholderLabel.node.active = displayText === '';
    },

    _hideLabels () {
        this._textLabel.node.active = false;
        this._placeholderLabel.node.active = false;
    },

    _updateString (text) {
        let textLabel = this._textLabel;
        // Not inited yet
        if (!textLabel) {
            return;
        }

        let displayText = text;
        if (displayText) {
            displayText = this._updateLabelStringStyle(displayText);
        }

        textLabel.string = displayText;
        this._impl.setString(text);
        if (!this._impl._editing && !this.stayOnTop) {
            this._showLabels();
        }
    },

    _updateLabelStringStyle (text, ignorePassword) {
        let inputFlag = this.inputFlag;
        if (!ignorePassword && inputFlag === InputFlag.PASSWORD) {
            let passwordString = '';
            let len = text.length;
            for (let i = 0; i < len; ++i) {
                passwordString += '\u25CF';
            }
            text = passwordString;
        } 
        else if (inputFlag === InputFlag.INITIAL_CAPS_ALL_CHARACTERS) {
            text = text.toUpperCase();
        }
        else if (inputFlag === InputFlag.INITIAL_CAPS_WORD) {
            text = capitalize(text);
        }
        else if (inputFlag === InputFlag.INITIAL_CAPS_SENTENCE) {
            text = capitalizeFirstLetter(text);
        }

        return text;
    },

    editBoxEditingDidBegan () {
        this._hideLabels();
        cc.Component.EventHandler.emitEvents(this.editingDidBegan, this);
        this.node.emit('editing-did-began', this);
    },

    editBoxEditingDidEnded () {
        if (!this.stayOnTop) {
            this._showLabels();
        }
        cc.Component.EventHandler.emitEvents(this.editingDidEnded, this);
        this.node.emit('editing-did-ended', this);
    },

    editBoxTextChanged (text) {
        text = this._updateLabelStringStyle(text, true);
        this.string = text;
        cc.Component.EventHandler.emitEvents(this.textChanged, text, this);
        this.node.emit('text-changed', this);
    },

    editBoxEditingReturn() {
        cc.Component.EventHandler.emitEvents(this.editingReturn, this);
        this.node.emit('editing-return', this);
    },

    onDestroy () {
        this._impl.clear();
    },

    onEnable () {
        this._impl && this._impl.onEnable();
    },

    onDisable () {
        this._impl && this._impl.onDisable();
    },

    __preload () {
        if (!CC_EDITOR) {
            this._registerEvent();
        }
        this._init();
    },

    _registerEvent () {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onTouchBegan, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this._onTouchEnded, this);
    },

    _onTouchBegan (event) {
        if (this._impl) {
            this._impl._onTouchBegan(event.touch);
        }
        event.stopPropagation();
    },

    _onTouchCancel (event) {
        if (this._impl) {
            this._impl._onTouchCancel();
        }
        event.stopPropagation();
    },

    _onTouchEnded (event) {
        if (this._impl) {
            this._impl._onTouchEnded();
        }
        event.stopPropagation();
    },

    /**
     * !#en Let the EditBox get focus
     * !#zh ????????? EditBox ????????????
     * @method setFocus
     */
    setFocus () {
        if(this._impl) {
            this._impl.setFocus();
        }
    },

    /**
     * !#en Determine whether EditBox is getting focus or not.
     * !#zh ?????? EditBox ?????????????????????
     * Note: only available on Web at the moment.
     * @method isFocused
     */
    isFocused () {
        let isFocused = false;
        if (this._impl) {
            isFocused = this._impl.isFocused();
        }
        return isFocused;
    },

    update () {
        if (this._impl) {
            this._impl.update();
        }
    }

});

cc.EditBox = module.exports = EditBox;

/**
 * !#en
 * Note: This event is emitted from the node to which the component belongs.
 * !#zh
 * ?????????????????????????????????????????? Node ????????????????????????????????? node.on ????????????
 * @event editing-did-began
 * @param {Event.EventCustom} event
 * @param {EditBox} editbox - The EditBox component.
 */

/**
 * !#en
 * Note: This event is emitted from the node to which the component belongs.
 * !#zh
 * ?????????????????????????????????????????? Node ????????????????????????????????? node.on ????????????
 * @event editing-did-ended
 * @param {Event.EventCustom} event
 * @param {EditBox} editbox - The EditBox component.
 */

/**
 * !#en
 * Note: This event is emitted from the node to which the component belongs.
 * !#zh
 * ?????????????????????????????????????????? Node ????????????????????????????????? node.on ????????????
 * @event text-changed
 * @param {Event.EventCustom} event
 * @param {EditBox} editbox - The EditBox component.
 */

/**
 * !#en
 * Note: This event is emitted from the node to which the component belongs.
 * !#zh
 * ?????????????????????????????????????????? Node ????????????????????????????????? node.on ????????????
 * @event editing-return
 * @param {Event.EventCustom} event
 * @param {EditBox} editbox - The EditBox component.
 */

/**
 * !#en if you don't need the EditBox and it isn't in any running Scene, you should
 * call the destroy method on this component or the associated node explicitly.
 * Otherwise, the created DOM element won't be removed from web page.
 * !#zh
 * ????????????????????? EditBox?????????????????????????????????????????????????????????????????????????????????????????? destroy???
 * ?????????????????????????????? DOM ??????????????? Web ?????????????????????
 * @example
 * editbox.node.parent = null;  // or  editbox.node.removeFromParent(false);
 * // when you don't need editbox anymore
 * editbox.node.destroy();
 * @method destroy
 * @return {Boolean} whether it is the first time the destroy being called
 */
