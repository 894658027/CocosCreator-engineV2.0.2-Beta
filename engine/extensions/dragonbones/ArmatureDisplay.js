/****************************************************************************
 Copyright (c) 2016 Chukong Technologies Inc.
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

const RenderComponent = require('../../cocos2d/core/components/CCRenderComponent');
const SpriteMaterial = require('../../cocos2d/core/renderer/render-engine').SpriteMaterial;

let EventTarget = require('../../cocos2d/core/event/event-target');

const Node = require('../../cocos2d/core/CCNode');
const Graphics = require('../../cocos2d/core/graphics/graphics');

/**
 * @module dragonBones
 */

let DefaultArmaturesEnum = cc.Enum({ 'default': -1 });
let DefaultAnimsEnum = cc.Enum({ '<None>': 0 });

function setEnumAttr (obj, propName, enumDef) {
    cc.Class.attr(obj, propName, {
        type: 'Enum',
        enumList: cc.Enum.getList(enumDef)
    });
}

/**
 * !#en
 * The Armature Display of DragonBones <br/>
 * <br/>
 * (Armature Display has a reference to a DragonBonesAsset and stores the state for ArmatureDisplay instance,
 * which consists of the current pose's bone SRT, slot colors, and which slot attachments are visible. <br/>
 * Multiple Armature Display can use the same DragonBonesAsset which includes all animations, skins, and attachments.) <br/>
 * !#zh
 * DragonBones ???????????? <br/>
 * <br/>
 * (Armature Display ?????????????????????????????????????????????????????????????????????
 * ??????????????????????????????slot ????????????????????? slot attachments ?????????<br/>
 * ?????? Armature Display ??????????????????????????????????????????????????????????????????????????? attachments???)<br/>
 *
 * @class ArmatureDisplay
 * @extends Component
 */
let ArmatureDisplay = cc.Class({
    name: 'dragonBones.ArmatureDisplay',
    extends: RenderComponent,
    mixins: [EventTarget],

    editor: CC_EDITOR && {
        menu: 'i18n:MAIN_MENU.component.renderers/DragonBones',
        //help: 'app://docs/html/components/spine.html', // TODO help document of dragonBones
    },
    
    properties: {
        _factory: {
            default: null,
            type: dragonBones.CCFactory,
            serializable: false,
        },

        /**
         * !#en
         * The DragonBones data contains the armatures information (bind pose bones, slots, draw order,
         * attachments, skins, etc) and animations but does not hold any state.<br/>
         * Multiple ArmatureDisplay can share the same DragonBones data.
         * !#zh
         * ?????????????????????????????????????????????????????????slots??????????????????
         * attachments??????????????????????????????????????????????????????<br/>
         * ?????? ArmatureDisplay ????????????????????????????????????
         * @property {DragonBonesAsset} dragonAsset
         */
        dragonAsset: {
            default: null,
            type: dragonBones.DragonBonesAsset,
            notify () {
                // parse the asset data
                this._parseDragonAsset();
                this._refresh();
                if (CC_EDITOR) {
                    this._defaultArmatureIndex = 0;
                    this._animationIndex = 0;
                }
            },
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.dragon_bones_asset'
        },

        /**
         * !#en
         * The atlas asset for the DragonBones.
         * !#zh
         * ????????????????????? Atlas Texture ?????????
         * @property {DragonBonesAtlasAsset} dragonAtlasAsset
         */
        dragonAtlasAsset: {
            default: null,
            type: dragonBones.DragonBonesAtlasAsset,
            notify () {
                // parse the atlas asset data
                this._parseDragonAtlasAsset();
                this._buildArmature();
                this._activateMaterial();
            },
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.dragon_bones_atlas_asset'
        },

        _armatureName: '',
        /**
         * !#en The name of current armature.
         * !#zh ????????? Armature ?????????
         * @property {String} armatureName
         */
        armatureName: {
            get () {
                return this._armatureName;
            },
            set (value) {
                this._armatureName = value;
                let animNames = this.getAnimationNames(this._armatureName);

                if (!this.animationName || animNames.indexOf(this.animationName) < 0) {
                    if (CC_EDITOR) {
                        this.animationName = animNames[0];
                    }
                    else {
                        // Not use default animation name at runtime
                        this.animationName = '';
                    }
                }

                if (this._armature) {
                    this._factory._dragonBones.clock.remove(this._armature);
                }
                this._refresh();
                if (this._armature) {
                    this._factory._dragonBones.clock.add(this._armature);
                }
                
            },
            visible: false
        },

        _animationName: '',
        /**
         * !#en The name of current playing animation.
         * !#zh ??????????????????????????????
         * @property {String} animationName
         */
        animationName: {
            get () {
                return this._animationName;
            },
            set (value) {
                this._animationName = value;
            },
            visible: false
        },

        /**
         * @property {Number} _defaultArmatureIndex
         */
        _defaultArmatureIndex: {
            default: 0,
            notify () {
                let armatureName = '';
                if (this.dragonAsset) {
                    let armaturesEnum;
                    if (this.dragonAsset) {
                        armaturesEnum = this.dragonAsset.getArmatureEnum();
                    }
                    if (!armaturesEnum) {
                        return cc.errorID(7400, this.name);
                    }

                    armatureName = armaturesEnum[this._defaultArmatureIndex];
                }

                if (armatureName !== undefined) {
                    this.armatureName = armatureName;
                }
                else {
                    cc.errorID(7401, this.name);
                }
            },
            type: DefaultArmaturesEnum,
            visible: true,
            editorOnly: true,
            displayName: "Armature",
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.armature_name'
        },

        // value of 0 represents no animation
        _animationIndex: {
            default: 0,
            notify () {
                if (this._animationIndex === 0) {
                    this.animationName = '';
                    return;
                }

                let animsEnum;
                if (this.dragonAsset) {
                    animsEnum = this.dragonAsset.getAnimsEnum(this.armatureName);
                }

                if (!animsEnum) {
                    return;
                }

                let animName = animsEnum[this._animationIndex];
                if (animName !== undefined) {
                    this.animationName = animName;
                }
                else {
                    cc.errorID(7402, this.name);
                }
            },
            type: DefaultAnimsEnum,
            visible: true,
            editorOnly: true,
            displayName: 'Animation',
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.animation_name'
        },

        /**
         * !#en The time scale of this armature.
         * !#zh ????????????????????????????????????????????????
         * @property {Number} timeScale
         * @default 1
         */
        timeScale: {
            default: 1,
            notify () {
                this._armature.animation.timeScale = this.timeScale;
            },
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.time_scale'
        },

        /**
         * !#en The play times of the default animation.
         *      -1 means using the value of config file;
         *      0 means repeat for ever
         *      >0 means repeat times
         * !#zh ?????????????????????????????????
         *      -1 ???????????????????????????????????????;
         *      0 ??????????????????
         *      >0 ??????????????????
         * @property {Number} playTimes
         * @default -1
         */
        playTimes: {
            default: -1,
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.play_times'
        },

        /**
         * !#en Indicates whether open debug bones.
         * !#zh ???????????? bone ??? debug ?????????
         * @property {Boolean} debugBones
         * @default false
         */
        debugBones: {
            default: false,
            notify () {
                this._initDebugDraw();
            },
            tooltip: CC_DEV && 'i18n:COMPONENT.dragon_bones.debug_bones'
        },
    },

    ctor () {
        this._inited = false;
        this._factory = dragonBones.CCFactory.getInstance();
    },

    __preload () {
        this._init();
    },

    _init () {
        if (this._inited) return;
        this._inited = true;

        this._parseDragonAsset();
        this._parseDragonAtlasAsset();
        this._refresh();
        this._activateMaterial();
    },

    onEnable () {
        this._super();
        if (this._armature) {
            this._factory._dragonBones.clock.add(this._armature);
        }
    },

    onDisable () {
        this._super();
        if (this._armature) {
            this._factory._dragonBones.clock.remove(this._armature);
        }
    },

    onDestroy () {
        this._super();
        this._inited = false;
        if (this._armature) {
            this._armature.dispose();
            this._armature = null;
        }
    },

    _initDebugDraw () {
        if (this.debugBones) {
            if (!this._debugDraw) {
                let debugDrawNode = new cc.PrivateNode();
                debugDrawNode.name = 'DEBUG_DRAW_NODE';
                let debugDraw = debugDrawNode.addComponent(Graphics);
                debugDraw.lineWidth = 1;
                debugDraw.strokeColor = cc.color(255, 0, 0, 255);
                
                this._debugDraw = debugDraw;
            }

            this._debugDraw.node.parent = this.node;
        }
        else if (this._debugDraw) {
            this._debugDraw.node.parent = null;
        }
    },

    _activateMaterial () {
        let texture = this.dragonAtlasAsset && this.dragonAtlasAsset.texture;
        

        // Get material
        let material = this._material || new SpriteMaterial();
        material.useColor = false;

        if (texture) {
            material.texture = texture;
            this.markForUpdateRenderData(true);
            this.markForRender(true);
        }
        else {
            this.disableRender();
        }

        this._updateMaterial(material);
    },

    _buildArmature () {
        if (!this.dragonAsset || !this.dragonAtlasAsset || !this.armatureName) return;

        let factory = dragonBones.CCFactory.getInstance();
        this._armature = factory.buildArmatureDisplay(this.armatureName, this.dragonAsset._dragonBonesData.name, this);
        this._armature.animation.timeScale = this.timeScale;

        if (this.animationName) {
            this.playAnimation(this.animationName, this.playTimes);
        }
    },

    _parseDragonAsset () {
        if (this.dragonAsset) {
            this.dragonAsset.init(this._factory);
        }
    },

    _parseDragonAtlasAsset () {
        if (this.dragonAtlasAsset) {
            this.dragonAtlasAsset.init(this._factory);
        }
    },

    _refresh () {
        this._buildArmature();

        if (CC_EDITOR) {
            // update inspector
            this._updateArmatureEnum();
            this._updateAnimEnum();
            Editor.Utils.refreshSelectedInspector('node', this.node.uuid);
        }
    },

    // update animation list for editor
    _updateAnimEnum: CC_EDITOR && function () {
        let animEnum;
        if (this.dragonAsset) {
            animEnum = this.dragonAsset.getAnimsEnum(this.armatureName);
        }
        // change enum
        setEnumAttr(this, '_animationIndex', animEnum || DefaultAnimsEnum);
    },

    // update armature list for editor
    _updateArmatureEnum: CC_EDITOR && function () {
        let armatureEnum;
        if (this.dragonAsset) {
            armatureEnum = this.dragonAsset.getArmatureEnum();
        }
        // change enum
        setEnumAttr(this, '_defaultArmatureIndex', armatureEnum || DefaultArmaturesEnum);
    },

    /**
     * !#en
     * Play the specified animation.
     * Parameter animName specify the animation name.
     * Parameter playTimes specify the repeat times of the animation.
     * -1 means use the value of the config file.
     * 0 means play the animation for ever.
     * >0 means repeat times.
     * !#zh
     * ?????????????????????.
     * animName ??????????????????????????????
     * playTimes ??????????????????????????????
     * -1 ????????????????????????????????????
     * 0 ????????????????????????
     * >0 ???????????????????????????
     * @method playAnimation
     * @param {String} animName
     * @param {Number} playTimes
     * @return {dragonBones.AnimationState}
     */
    playAnimation (animName, playTimes) {
        if (this._armature) {
            this.playTimes = (playTimes === undefined) ? -1 : playTimes;
            this.animationName = animName;
            return this._armature.animation.play(animName, this.playTimes);
        }

        return null;
    },

    /**
     * !#en
     * Get the all armature names in the DragonBones Data.
     * !#zh
     * ?????? DragonBones ?????????????????? armature ??????
     * @method getArmatureNames
     * @returns {Array}
     */
    getArmatureNames () {
        var dragonBonesData = this.dragonAsset && this.dragonAsset._dragonBonesData;
        return (dragonBonesData && dragonBonesData.armatureNames) || [];
    },

    /**
     * !#en
     * Get the all animation names of specified armature.
     * !#zh
     * ??????????????? armature ????????????????????????
     * @method getAnimationNames
     * @param {String} armatureName
     * @returns {Array}
     */
    getAnimationNames (armatureName) {
        let ret = [];
        if (this.dragonAsset && this.dragonAsset._dragonBonesData) {
            let armatureData = this.dragonAsset._dragonBonesData.getArmature(armatureName);
            if (armatureData) {
                for (let animName in armatureData.animations) {
                    if (armatureData.animations.hasOwnProperty(animName)) {
                        ret.push(animName);
                    }
                }
            }
        }

        return ret;
    },

    /**
     * !#en
     * Add event listener for the DragonBones Event.
     * !#zh
     * ?????? DragonBones ??????????????????
     * @method addEventListener
     * @param {String} type - A string representing the event type to listen for.
     * @param {Function} listener - The callback that will be invoked when the event is dispatched.
     * @param {Event} listener.event event
     * @param {Object} [target] - The target (this object) to invoke the callback, can be null
     */
    addEventListener (eventType, listener, target) {
        this.addDBEventListener(eventType, listener, target);
    },

    /**
     * !#en
     * Remove the event listener for the DragonBones Event.
     * !#zh
     * ?????? DragonBones ??????????????????
     * @method removeEventListener
     * @param {String} type - A string representing the event type to listen for.
     * @param {Function} [listener]
     * @param {Object} [target]
     */
    removeEventListener (eventType, listener, target) {
        this.removeDBEventListener(eventType, listener, target);
    },

    /**
     * !#en
     * Build the armature for specified name.
     * !#zh
     * ????????????????????? armature ??????
     * @method buildArmature
     * @param {String} armatureName
     * @param {Node} node
     * @return {dragonBones.ArmatureDisplay}
     */
    buildArmature (armatureName, node) {
        return dragonBones.CCFactory.getInstance().createArmatureNode(this, armatureName, node);
    },

    /**
     * !#en
     * Get the current armature object of the ArmatureDisplay.
     * !#zh
     * ?????? ArmatureDisplay ??????????????? Armature ??????
     * @method armature
     * @returns {Object}
     */
    armature () {
        return this._armature;
    },

    ////////////////////////////////////
    // dragonbones api
    dbInit (armature) {
        this._armature = armature;
    },

    dbClear () {
        this._armature = null;
    },

    dbUpdate () {
        if (!CC_DEBUG) return;
        this._initDebugDraw();

        let debugDraw = this._debugDraw;
        if (!debugDraw) return;
        
        debugDraw.clear();
        let bones = this._armature.getBones();
        for (let i = 0, l = bones.length; i < l; i++) {
            let bone =  bones[i];
            let boneLength = Math.max(bone.boneData.length, 5);
            let startX = bone.globalTransformMatrix.tx;
            let startY = -bone.globalTransformMatrix.ty;
            let endX = startX + bone.globalTransformMatrix.a * boneLength;
            let endY = startY - bone.globalTransformMatrix.b * boneLength;

            debugDraw.moveTo(startX, startY);
            debugDraw.lineTo(endX, endY);
            debugDraw.stroke();
        }
    },

    advanceTimeBySelf  (on) {
        this.shouldAdvanced = !!on;
    },

    hasDBEventListener (type) {
        return this.hasEventListener(type);
    },

    addDBEventListener (type, listener, target) {
        this.on(type, listener, target);
    },

    removeDBEventListener (type, listener, target) {
        this.off(type, listener, target);
    },

    dispatchDBEvent  (type, eventObject) {
        this.emit(type, eventObject);
    },
    ////////////////////////////////////
});

module.exports = dragonBones.ArmatureDisplay = ArmatureDisplay;
