/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

'use strict';

const BaseNode = require('./utils/base-node');
const PrefabHelper = require('./utils/prefab-helper');
const mathPools = require('./utils/math-pools');
const math = require('./renderer/render-engine').math;
const AffineTrans = require('./utils/affine-transform');
const eventManager = require('./event-manager');
const macro = require('./platform/CCMacro');
const misc = require('./utils/misc');
const js = require('./platform/js');
const Event = require('./event/event');
const EventTarget = require('./event/event-target');
const RenderFlow = require('./renderer/render-flow');

const Flags = cc.Object.Flags;
const Destroying = Flags.Destroying;

const ERR_INVALID_NUMBER = CC_EDITOR && 'The %s is invalid';
const ONE_DEGREE = Math.PI / 180;

var ActionManagerExist = !!cc.ActionManager;
var emptyFunc = function () {};
var _vec2a = cc.v2();
var _vec2b = cc.v2();
var _mat4_temp = math.mat4.create();
var _vec3_temp = math.vec3.create();
var _quat_temp = math.quat.create();
var _globalOrderOfArrival = 1;
var _cachedArray = new Array(16);
_cachedArray.length = 0;

const POSITION_ON = 1 << 0;
const SCALE_ON = 1 << 1;
const ROTATION_ON = 1 << 2;
const SIZE_ON = 1 << 3;
const ANCHOR_ON = 1 << 4;


let BuiltinGroupIndex = cc.Enum({
    DEBUG: 31
})


/**
 * !#en Node's local dirty properties flag
 * !#zh Node ??????????????? dirty ?????????
 * @enum Node._LocalDirtyFlag
 * @static
 * @private
 * @namespace Node
 */
var LocalDirtyFlag = cc.Enum({
    /**
     * !#en Flag for position dirty
     * !#zh ?????? dirty ????????????
     * @property {Number} POSITION
     * @static
     */
    POSITION: 1 << 0,
    /**
     * !#en Flag for scale dirty
     * !#zh ?????? dirty ????????????
     * @property {Number} SCALE
     * @static
     */
    SCALE: 1 << 1,
    /**
     * !#en Flag for rotation dirty
     * !#zh ?????? dirty ????????????
     * @property {Number} ROTATION
     * @static
     */
    ROTATION: 1 << 2,
    /**
     * !#en Flag for skew dirty
     * !#zh skew dirty ????????????
     * @property {Number} SKEW
     * @static
     */
    SKEW: 1 << 3,
    /**
     * !#en Flag for position or rotation dirty
     * !#zh ??????????????? dirty ????????????
     * @property {Number} RT
     * @static
     */
    RT: 1 << 0 | 1 << 1 | 1 << 2,
    /**
     * !#en Flag for all dirty properties
     * !#zh ???????????? dirty ??????????????????
     * @property {Number} ALL
     * @static
     */
    ALL: 0xffff,
});

/**
 * !#en The event type supported by Node
 * !#zh Node ?????????????????????
 * @class Node.EventType
 * @static
 * @namespace Node
 */
var EventType = cc.Enum({
    /**
     * !#en The event type for touch start event, you can use its value directly: 'touchstart'
     * !#zh ??????????????????????????????
     * @property {String} TOUCH_START
     * @static
     */
    TOUCH_START: 'touchstart',
    /**
     * !#en The event type for touch move event, you can use its value directly: 'touchmove'
     * !#zh ?????????????????????????????????
     * @property {String} TOUCH_MOVE
     * @static
     */
    TOUCH_MOVE: 'touchmove',
    /**
     * !#en The event type for touch end event, you can use its value directly: 'touchend'
     * !#zh ???????????????????????????????????????????????????
     * @property {String} TOUCH_END
     * @static
     */
    TOUCH_END: 'touchend',
    /**
     * !#en The event type for touch end event, you can use its value directly: 'touchcancel'
     * !#zh ???????????????????????????????????????????????????
     * @property {String} TOUCH_CANCEL
     * @static
     */
    TOUCH_CANCEL: 'touchcancel',

    /**
     * !#en The event type for mouse down events, you can use its value directly: 'mousedown'
     * !#zh ?????????????????????????????????
     * @property {String} MOUSE_DOWN
     * @static
     */
    MOUSE_DOWN: 'mousedown',
    /**
     * !#en The event type for mouse move events, you can use its value directly: 'mousemove'
     * !#zh ?????????????????????????????????????????????????????????????????????????????????
     * @property {String} MOUSE_MOVE
     * @static
     */
    MOUSE_MOVE: 'mousemove',
    /**
     * !#en The event type for mouse enter target events, you can use its value directly: 'mouseenter'
     * !#zh ????????????????????????????????????????????????????????????
     * @property {String} MOUSE_ENTER
     * @static
     */
    MOUSE_ENTER: 'mouseenter',
    /**
     * !#en The event type for mouse leave target events, you can use its value directly: 'mouseleave'
     * !#zh ????????????????????????????????????????????????????????????
     * @property {String} MOUSE_LEAVE
     * @static
     */
    MOUSE_LEAVE: 'mouseleave',
    /**
     * !#en The event type for mouse up events, you can use its value directly: 'mouseup'
     * !#zh ????????????????????????????????????????????????
     * @property {String} MOUSE_UP
     * @static
     */
    MOUSE_UP: 'mouseup',
    /**
     * !#en The event type for mouse wheel events, you can use its value directly: 'mousewheel'
     * !#zh ???????????????????????????
     * @property {String} MOUSE_WHEEL
     * @static
     */
    MOUSE_WHEEL: 'mousewheel',

    /**
     * !#en The event type for position change events.
     * Performance note, this event will be triggered every time corresponding properties being changed,
     * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
     * !#zh ??????????????????????????????????????????
     * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @property {String} POSITION_CHANGED
     * @static
     */
    POSITION_CHANGED: 'position-changed',
    /**
     * !#en The event type for rotation change events.
     * Performance note, this event will be triggered every time corresponding properties being changed,
     * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
     * !#zh ??????????????????????????????????????????
     * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @property {String} ROTATION_CHANGED
     * @static
     */
    ROTATION_CHANGED: 'rotation-changed',
    /**
     * !#en The event type for scale change events.
     * Performance note, this event will be triggered every time corresponding properties being changed,
     * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
     * !#zh ??????????????????????????????????????????
     * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @property {String} SCALE_CHANGED
     * @static
     */
    SCALE_CHANGED: 'scale-changed',
    /**
     * !#en The event type for size change events.
     * Performance note, this event will be triggered every time corresponding properties being changed,
     * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
     * !#zh ??????????????????????????????????????????
     * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @property {String} SIZE_CHANGED
     * @static
     */
    SIZE_CHANGED: 'size-changed',
    /**
     * !#en The event type for anchor point change events.
     * Performance note, this event will be triggered every time corresponding properties being changed,
     * if the event callback have heavy logic it may have great performance impact, try to avoid such scenario.
     * !#zh ??????????????????????????????????????????
     * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @property {String} ANCHOR_CHANGED
     * @static
     */
    ANCHOR_CHANGED: 'anchor-changed',
    /**
     * !#en The event type for new child added events.
     * !#zh ????????????????????????????????????????????????
     * @property {String} CHILD_ADDED
     * @static
     */
    CHILD_ADDED: 'child-added',
    /**
     * !#en The event type for child removed events.
     * !#zh ??????????????????????????????????????????
     * @property {String} CHILD_REMOVED
     * @static
     */
    CHILD_REMOVED: 'child-removed',
    /**
     * !#en The event type for children reorder events.
     * !#zh ?????????????????????????????????????????????
     * @property {String} CHILD_REORDER
     * @static
     */
    CHILD_REORDER: 'child-reorder',
    /**
     * !#en The event type for node group changed events.
     * !#zh ??????????????????????????????????????????????????????
     * @property {String} GROUP_CHANGED
     * @static
     */
    GROUP_CHANGED: 'group-changed',
});

var _touchEvents = [
    EventType.TOUCH_START,
    EventType.TOUCH_MOVE,
    EventType.TOUCH_END,
    EventType.TOUCH_CANCEL,
];
var _mouseEvents = [
    EventType.MOUSE_DOWN,
    EventType.MOUSE_ENTER,
    EventType.MOUSE_MOVE,
    EventType.MOUSE_LEAVE,
    EventType.MOUSE_UP,
    EventType.MOUSE_WHEEL,
];

var _currentHovered = null;

var _touchStartHandler = function (touch, event) {
    var pos = touch.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.TOUCH_START;
        event.touch = touch;
        event.bubbles = true;
        node.dispatchEvent(event);
        return true;
    }
    return false;
};
var _touchMoveHandler = function (touch, event) {
    var node = this.owner;
    event.type = EventType.TOUCH_MOVE;
    event.touch = touch;
    event.bubbles = true;
    node.dispatchEvent(event);
};
var _touchEndHandler = function (touch, event) {
    var pos = touch.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.TOUCH_END;
    }
    else {
        event.type = EventType.TOUCH_CANCEL;
    }
    event.touch = touch;
    event.bubbles = true;
    node.dispatchEvent(event);
};
var _touchCancelHandler = function (touch, event) {
    var pos = touch.getLocation();
    var node = this.owner;

    event.type = EventType.TOUCH_CANCEL;
    event.touch = touch;
    event.bubbles = true;
    node.dispatchEvent(event);
};

var _mouseDownHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.MOUSE_DOWN;
        event.bubbles = true;
        node.dispatchEvent(event);
    }
};
var _mouseMoveHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;
    var hit = node._hitTest(pos, this);
    if (hit) {
        if (!this._previousIn) {
            // Fix issue when hover node switched, previous hovered node won't get MOUSE_LEAVE notification
            if (_currentHovered && _currentHovered._mouseListener) {
                event.type = EventType.MOUSE_LEAVE;
                _currentHovered.dispatchEvent(event);
                _currentHovered._mouseListener._previousIn = false;
            }
            _currentHovered = this.owner;
            event.type = EventType.MOUSE_ENTER;
            node.dispatchEvent(event);
            this._previousIn = true;
        }
        event.type = EventType.MOUSE_MOVE;
        event.bubbles = true;
        node.dispatchEvent(event);
    }
    else if (this._previousIn) {
        event.type = EventType.MOUSE_LEAVE;
        node.dispatchEvent(event);
        this._previousIn = false;
        _currentHovered = null;
    }
    else {
        // continue dispatching
        return;
    }

    // Event processed, cleanup
    event.stopPropagation();
};
var _mouseUpHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.MOUSE_UP;
        event.bubbles = true;
        node.dispatchEvent(event);
        event.stopPropagation();
    }
};
var _mouseWheelHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.MOUSE_WHEEL;
        event.bubbles = true;
        node.dispatchEvent(event);
        event.stopPropagation();
    }
};

function _searchMaskInParent (node) {
    var Mask = cc.Mask;
    if (Mask) {
        var index = 0;
        for (var curr = node; curr && cc.Node.isNode(curr); curr = curr._parent, ++index) {
            if (curr.getComponent(Mask)) {
                return {
                    index: index,
                    node: curr
                };
            }
        }
    }
    return null;
}

function _checkListeners (node, events) {
    if (!(node._objFlags & Destroying)) {
        var i = 0;
        if (node._bubblingListeners) {
            for (; i < events.length; ++i) {
                if (node._bubblingListeners.hasEventListener(events[i])) {
                    return true;
                }
            }
        }
        if (node._capturingListeners) {
            for (; i < events.length; ++i) {
                if (node._capturingListeners.hasEventListener(events[i])) {
                    return true;
                }
            }
        }
        return false;
    }
    return true;
}

function _doDispatchEvent (owner, event) {
    var target, i;
    event.target = owner;

    // Event.CAPTURING_PHASE
    _cachedArray.length = 0;
    owner._getCapturingTargets(event.type, _cachedArray);
    // capturing
    event.eventPhase = 1;
    for (i = _cachedArray.length - 1; i >= 0; --i) {
        target = _cachedArray[i];
        if (target._capturingListeners) {
            event.currentTarget = target;
            // fire event
            target._capturingListeners.emit(event.type, event, _cachedArray);
            // check if propagation stopped
            if (event._propagationStopped) {
                _cachedArray.length = 0;
                return;
            }
        }
    }
    _cachedArray.length = 0;

    // Event.AT_TARGET
    // checks if destroyed in capturing callbacks
    event.eventPhase = 2;
    event.currentTarget = owner;
    if (owner._capturingListeners) {
        owner._capturingListeners.emit(event.type, event);
    }
    if (!event._propagationImmediateStopped && owner._bubblingListeners) {
        owner._bubblingListeners.emit(event.type, event);
    }

    if (!event._propagationStopped && event.bubbles) {
        // Event.BUBBLING_PHASE
        owner._getBubblingTargets(event.type, _cachedArray);
        // propagate
        event.eventPhase = 3;
        for (i = 0; i < _cachedArray.length; ++i) {
            target = _cachedArray[i];
            if (target._bubblingListeners) {
                event.currentTarget = target;
                // fire event
                target._bubblingListeners.emit(event.type, event);
                // check if propagation stopped
                if (event._propagationStopped) {
                    _cachedArray.length = 0;
                    return;
                }
            }
        }
    }
    _cachedArray.length = 0;
};

/**
 * !#en
 * Class of all entities in Cocos Creator scenes.<br/>
 * For events supported by Node, please refer to {{#crossLink "Node.EventType"}}{{/crossLink}}
 * !#zh
 * Cocos Creator ??????????????????????????????<br/>
 * ????????????????????????????????? {{#crossLink "Node.EventType"}}{{/crossLink}}???
 * @class Node
 * @extends _BaseNode
 */
var Node = cc.Class({
    name: 'cc.Node',
    extends: BaseNode,

    properties: {
        // SERIALIZABLE
        _opacity: 255,
        _color: cc.Color.WHITE,
        _contentSize: cc.Size,
        _anchorPoint: cc.v2(0.5, 0.5),
        _position: cc.Vec3,
        _scaleX: {
            default: undefined,
            type: cc.Float
        },
        _scaleY: {
            default: undefined,
            type: cc.Float
        },
        _scale: cc.Vec3,
        _rotationX: 0.0,
        _rotationY: 0.0,
        _quat: cc.Quat,
        _skewX: 0.0,
        _skewY: 0.0,
        _localZOrder: {
            default: 0,
            serializable: false
        },
        _zIndex: 0,

        // internal properties

        /**
         * !#en
         * Group index of node.<br/>
         * Which Group this node belongs to will resolve that this node's collision components can collide with which other collision componentns.<br/>
         * !#zh
         * ????????????????????????<br/>
         * ???????????????????????????????????????????????????????????????????????????????????????<br/>
         * @property groupIndex
         * @type {Integer}
         * @default 0
         */
        groupIndex: {
            default: 0,
            type: cc.Integer
        },

        /**
         * !#en
         * Group of node.<br/>
         * Which Group this node belongs to will resolve that this node's collision components can collide with which other collision componentns.<br/>
         * !#zh
         * ??????????????????<br/>
         * ???????????????????????????????????????????????????????????????????????????????????????<br/>
         * @property group
         * @type {String}
         */
        group: {
            get () {
                return cc.game.groupList[this.groupIndex] || '';
            },

            set (value) {
                this.groupIndex = cc.game.groupList.indexOf(value);
                this.emit(EventType.GROUP_CHANGED, this);
            }
        },

        //properties moved from base node begin

        /**
         * !#en The position (x, y) of the node in its parent's coordinates.
         * !#zh ??????????????????????????????????????????x, y??????
         * @property {Vec2} position
         * @example
         * cc.log("Node Position: " + node.position);
         */

        /**
         * !#en x axis position of node.
         * !#zh ?????? X ????????????
         * @property x
         * @type {Number}
         * @example
         * node.x = 100;
         * cc.log("Node Position X: " + node.x);
         */
        x: {
            get () {
                return this._position.x;
            },
            set (value) {
                var localPosition = this._position;
                if (value !== localPosition.x) {
                    if (!CC_EDITOR || isFinite(value)) {
                        if (CC_EDITOR) {
                            var oldValue = localPosition.x;
                        }

                        localPosition.x = value;
                        this.setLocalDirty(LocalDirtyFlag.POSITION);
                        this._renderFlag |= RenderFlow.FLAG_WORLD_TRANSFORM;
                        
                        // fast check event
                        if (this._eventMask & POSITION_ON) {
                            // send event
                            if (CC_EDITOR) {
                                this.emit(EventType.POSITION_CHANGED, new cc.Vec2(oldValue, localPosition.y));
                            }
                            else {
                                this.emit(EventType.POSITION_CHANGED);
                            }
                        }
                    }
                    else {
                        cc.error(ERR_INVALID_NUMBER, 'new x');
                    }
                }
            },
        },

        /**
         * !#en y axis position of node.
         * !#zh ?????? Y ????????????
         * @property y
         * @type {Number}
         * @example
         * node.y = 100;
         * cc.log("Node Position Y: " + node.y);
         */
        y: {
            get () {
                return this._position.y;
            },
            set (value) {
                var localPosition = this._position;
                if (value !== localPosition.y) {
                    if (!CC_EDITOR || isFinite(value)) {
                        if (CC_EDITOR) {
                            var oldValue = localPosition.y;
                        }

                        localPosition.y = value;
                        this.setLocalDirty(LocalDirtyFlag.POSITION);
                        this._renderFlag |= RenderFlow.FLAG_WORLD_TRANSFORM;

                        // fast check event
                        if (this._eventMask & POSITION_ON) {
                            // send event
                            if (CC_EDITOR) {
                                this.emit(EventType.POSITION_CHANGED, new cc.Vec2(localPosition.x, oldValue));
                            }
                            else {
                                this.emit(EventType.POSITION_CHANGED);
                            }
                        }
                    }
                    else {
                        cc.error(ERR_INVALID_NUMBER, 'new y');
                    }
                }
            },
        },
        
        z: {
            get () {
                return this._position.z;
            },
            set (value) {
                var localPosition = this._position;
                if (value !== localPosition.z) {
                    if (!CC_EDITOR || isFinite(value)) {
                        localPosition.z = value;
                        this.setLocalDirty(LocalDirtyFlag.POSITION);
                        this._renderFlag |= RenderFlow.FLAG_WORLD_TRANSFORM;
                        // fast check event
                        if (this._eventMask & POSITION_ON) {
                            this.emit(EventType.POSITION_CHANGED);
                        }
                    }
                    else {
                        cc.error(ERR_INVALID_NUMBER, 'new z');
                    }
                }
            },
        },

        /**
         * !#en Rotation of node.
         * !#zh ????????????????????????
         * @property rotation
         * @type {Number}
         * @example
         * node.rotation = 90;
         * cc.log("Node Rotation: " + node.rotation);
         */
        rotation: {
            get () {
                return this._rotationX;
            },
            set (value) {
                if (this._rotationX !== value || this._rotationY !== value) {
                    this._rotationX = this._rotationY = value;
                    // Update quaternion from rotation
                    math.quat.fromEuler(this._quat, 0, 0, -value);
                    this.setLocalDirty(LocalDirtyFlag.ROTATION);
                    this._renderFlag |= RenderFlow.FLAG_TRANSFORM;

                    if (this._eventMask & ROTATION_ON) {
                        this.emit(EventType.ROTATION_CHANGED);
                    }
                }
            }
        },

        /**
         * !#en Rotation on x axis.
         * !#zh ????????? X ??????????????????
         * @property rotationX
         * @type {Number}
         * @example
         * node.rotationX = 45;
         * cc.log("Node Rotation X: " + node.rotationX);
         */
        rotationX: {
            get () {
                return this._rotationX;
            },
            set (value) {
                if (this._rotationX !== value) {
                    this._rotationX = value;
                    // Update quaternion from rotation
                    if (this._rotationX === this._rotationY) {
                        math.quat.fromEuler(this._quat, 0, 0, -value);
                    }
                    else {
                        math.quat.fromEuler(this._quat, value, this._rotationY, 0);
                    }
                    this.setLocalDirty(LocalDirtyFlag.ROTATION);
                    this._renderFlag |= RenderFlow.FLAG_TRANSFORM;

                    if (this._eventMask & ROTATION_ON) {
                        this.emit(EventType.ROTATION_CHANGED);
                    }
                }
            },
        },

        /**
         * !#en Rotation on y axis.
         * !#zh ????????? Y ??????????????????
         * @property rotationY
         * @type {Number}
         * @example
         * node.rotationY = 45;
         * cc.log("Node Rotation Y: " + node.rotationY);
         */
        rotationY: {
            get () {
                return this._rotationY;
            },
            set (value) {
                if (this._rotationY !== value) {
                    this._rotationY = value;
                    // Update quaternion from rotation
                    if (this._rotationX === this._rotationY) {
                        math.quat.fromEuler(this._quat, 0, 0, -value);
                    }
                    else {
                        math.quat.fromEuler(this._quat, this._rotationX, value, 0);
                    }
                    this.setLocalDirty(LocalDirtyFlag.ROTATION);
                    this._renderFlag |= RenderFlow.FLAG_TRANSFORM;

                    if (this._eventMask & ROTATION_ON) {
                        this.emit(EventType.ROTATION_CHANGED);
                    }
                }
            },
        },

        /**
         * !#en The local scale relative to the parent.
         * !#zh ?????????????????????????????????
         * @property scale
         * @type {Number}
         * @example
         * node.scale = 1;
         */

        /**
         * !#en Scale on x axis.
         * !#zh ?????? X ????????????
         * @property scaleX
         * @type {Number}
         * @example
         * node.scaleX = 0.5;
         * cc.log("Node Scale X: " + node.scaleX);
         */
        scaleX: {
            get () {
                return this._scale.x;
            },
            set (value) {
                if (this._scale.x !== value) {
                    this._scale.x = value;
                    this.setLocalDirty(LocalDirtyFlag.SCALE);
                    this._renderFlag |= RenderFlow.FLAG_TRANSFORM;

                    if (this._eventMask & SCALE_ON) {
                        this.emit(EventType.SCALE_CHANGED);
                    }
                }
            },
        },

        /**
         * !#en Scale on y axis.
         * !#zh ?????? Y ????????????
         * @property scaleY
         * @type {Number}
         * @example
         * node.scaleY = 0.5;
         * cc.log("Node Scale Y: " + node.scaleY);
         */
        scaleY: {
            get () {
                return this._scale.y;
            },
            set (value) {
                if (this._scale.y !== value) {
                    this._scale.y = value;
                    this.setLocalDirty(LocalDirtyFlag.SCALE);
                    this._renderFlag |= RenderFlow.FLAG_TRANSFORM;

                    if (this._eventMask & SCALE_ON) {
                        this.emit(EventType.SCALE_CHANGED);
                    }
                }
            },
        },

        /**
         * !#en Skew x
         * !#zh ????????? X ??????????????????
         * @property skewX
         * @type {Number}
         * @example
         * node.skewX = 0;
         * cc.log("Node SkewX: " + node.skewX);
         */
        skewX: {
            get () {
                return this._skewX;
            },
            set (value) {
                this._skewX = value;
                this.setLocalDirty(LocalDirtyFlag.SKEW);
                this._renderFlag |= RenderFlow.FLAG_TRANSFORM;
            }
        },

        /**
         * !#en Skew y
         * !#zh ????????? Y ??????????????????
         * @property skewY
         * @type {Number}
         * @example
         * node.skewY = 0;
         * cc.log("Node SkewY: " + node.skewY);
         */
        skewY: {
            get () {
                return this._skewY;
            },
            set (value) {
                this._skewY = value;
                this.setLocalDirty(LocalDirtyFlag.SKEW);
                this._renderFlag |= RenderFlow.FLAG_TRANSFORM;
            }
        },

        /**
         * !#en Opacity of node, default value is 255.
         * !#zh ?????????????????????????????? 255???
         * @property opacity
         * @type {Number}
         * @example
         * node.opacity = 255;
         */
        opacity: {
            get () {
                return this._opacity;
            },
            set (value) {
                if (this._opacity !== value) {
                    this._opacity = value;
                    this._renderFlag |= RenderFlow.FLAG_OPACITY | RenderFlow.FLAG_COLOR;
                }
            },
            range: [0, 255]
        },

        /**
         * !#en Color of node, default value is white: (255, 255, 255).
         * !#zh ????????????????????????????????????????????????255???255???255??????
         * @property color
         * @type {Color}
         * @example
         * node.color = new cc.Color(255, 255, 255);
         */
        color: {
            get () {
                return this._color.clone()
            },
            set (value) {
                if (!this._color.equals(value)) {
                    this._color.set(value);
                    if (CC_DEV && value.a !== 255) {
                        cc.warnID(1626);
                    }
                    
                    if (this._renderComponent) {
                        this._renderFlag |= RenderFlow.FLAG_COLOR;
                    }
                }
            },
        },

        /**
         * !#en Anchor point's position on x axis.
         * !#zh ?????? X ??????????????????
         * @property anchorX
         * @type {Number}
         * @example
         * node.anchorX = 0;
         */
        anchorX: {
            get () {
                return this._anchorPoint.x;
            },
            set (value) {
                var anchorPoint = this._anchorPoint;
                if (anchorPoint.x !== value) {
                    anchorPoint.x = value;
                    if (this._eventMask & ANCHOR_ON) {
                        this.emit(EventType.ANCHOR_CHANGED);
                    }
                }
            },
        },

        /**
         * !#en Anchor point's position on y axis.
         * !#zh ?????? Y ??????????????????
         * @property anchorY
         * @type {Number}
         * @example
         * node.anchorY = 0;
         */
        anchorY: {
            get () {
                return this._anchorPoint.y;
            },
            set (value) {
                var anchorPoint = this._anchorPoint;
                if (anchorPoint.y !== value) {
                    anchorPoint.y = value;
                    if (this._eventMask & ANCHOR_ON) {
                        this.emit(EventType.ANCHOR_CHANGED);
                    }
                }
            },
        },

        /**
         * !#en Width of node.
         * !#zh ???????????????
         * @property width
         * @type {Number}
         * @example
         * node.width = 100;
         */
        width: {
            get () {
                return this._contentSize.width;
            },
            set (value) {
                if (value !== this._contentSize.width) {
                    if (CC_EDITOR) {
                        var clone = cc.size(this._contentSize.width, this._contentSize.height);
                    }
                    this._contentSize.width = value;
                    if (this._eventMask & SIZE_ON) {
                        if (CC_EDITOR) {
                            this.emit(EventType.SIZE_CHANGED, clone);
                        }
                        else {
                            this.emit(EventType.SIZE_CHANGED);
                        }
                    }
                }
            },
        },

        /**
         * !#en Height of node.
         * !#zh ???????????????
         * @property height
         * @type {Number}
         * @example
         * node.height = 100;
         */
        height: {
            get () {
                return this._contentSize.height;
            },
            set (value) {
                if (value !== this._contentSize.height) {
                    if (CC_EDITOR) {
                        var clone = cc.size(this._contentSize.width, this._contentSize.height);
                    }
                    this._contentSize.height = value;
                    if (this._eventMask & SIZE_ON) {
                        if (CC_EDITOR) {
                            this.emit(EventType.SIZE_CHANGED, clone);
                        }
                        else {
                            this.emit(EventType.SIZE_CHANGED);
                        }
                    }
                }
            },
        },

        /**
         * !#en zIndex is the 'key' used to sort the node relative to its siblings.<br/>
         * The value of zIndex should be in the range between cc.macro.MIN_ZINDEX and cc.macro.MAX_ZINDEX.<br/>
         * The Node's parent will sort all its children based on the zIndex value and the arrival order.<br/>
         * Nodes with greater zIndex will be sorted after nodes with smaller zIndex.<br/>
         * If two nodes have the same zIndex, then the node that was added first to the children's array will be in front of the other node in the array.<br/>
         * Node's order in children list will affect its rendering order. Parent is always rendering before all children.
         * !#zh zIndex ??????????????????????????????????????????????????????????????????????????????????????????????????????<br/>
         * zIndex ????????????????????? cc.macro.MIN_ZINDEX ??? cc.macro.MAX_ZINDEX ??????
         * ?????????????????????????????? zIndex ??????????????????????????????????????? zIndex ??????????????????????????????????????????????????? zIndex ??????????????????????????????????????????????????????????????????<br/>
         * ????????? children ???????????????????????????????????????????????????????????????????????????????????????
         * @property zIndex
         * @type {Number}
         * @example
         * node.zIndex = 1;
         * cc.log("Node zIndex: " + node.zIndex);
         */
        zIndex: {
            get () {
                return this._zIndex;
            },
            set (value) {
                if (value > macro.MAX_ZINDEX) {
                    cc.warnID(1636);
                    value = macro.MAX_ZINDEX;
                }
                else if (value < macro.MIN_ZINDEX) {
                    cc.warnID(1637);
                    value = macro.MIN_ZINDEX;
                }

                if (this._zIndex !== value) {
                    this._zIndex = value;
                    this._localZOrder = (this._localZOrder & 0x0000ffff) | (value << 16);

                    if (this._parent) {
                        this._parent._delaySort();
                    }
                }
            }
        },
    },

    /**
     * @method constructor
     * @param {String} [name]
     */
    ctor () {
        this._reorderChildDirty = false;
        
        // cache component
        this._widget = null;
        // fast render component access
        this._renderComponent = null;
        // Event listeners
        this._capturingListeners = null;
        this._bubblingListeners = null;
        // Touch event listener
        this._touchListener = null;
        // Mouse event listener
        this._mouseListener = null;

        // default scale
        this._scale.x = 1;
        this._scale.y = 1;
        this._scale.z = 1;

        this._matrix = mathPools.mat4.get();
        this._worldMatrix = mathPools.mat4.get();
        this._localMatDirty = LocalDirtyFlag.ALL;
        this._worldMatDirty = true;

        this._eventMask = 0;
        this._cullingMask = 1 << this.groupIndex;
    },

    statics: {
        EventType,
        _LocalDirtyFlag: LocalDirtyFlag,
        // is node but not scene
        isNode (obj) {
            return obj instanceof Node && (obj.constructor === Node || !(obj instanceof cc.Scene));
        },

        BuiltinGroupIndex
    },

    // OVERRIDES

    _onSiblingIndexChanged (index) {
        // update rendering scene graph, sort them by arrivalOrder
        var parent = this._parent;
        var siblings = parent._children;
        var i = 0, len = siblings.length, sibling;
        for (; i < len; i++) {
            sibling = siblings[i];
            sibling._updateOrderOfArrival();
            eventManager._setDirtyForNode(sibling);
        }
        parent._delaySort();
    },

    _onPreDestroy () {
        var destroyByParent = this._onPreDestroyBase();

        // Actions
        if (ActionManagerExist) {
            cc.director.getActionManager().removeAllActionsFromTarget(this);
        }

        // Remove Node.currentHovered
        if (_currentHovered === this) {
            _currentHovered = null;
        }

        // Remove all event listeners if necessary
        if (this._touchListener || this._mouseListener) {
            eventManager.removeListeners(this);
            if (this._touchListener) {
                this._touchListener.owner = null;
                this._touchListener.mask = null;
                this._touchListener = null;
            }
            if (this._mouseListener) {
                this._mouseListener.owner = null;
                this._mouseListener.mask = null;
                this._mouseListener = null;
            }
        }

        // Recycle math objects
        mathPools.mat4.put(this._matrix);
        mathPools.mat4.put(this._worldMatrix);
        this._matrix = this._worldMatrix = null;

        if (this._reorderChildDirty) {
            cc.director.__fastOff(cc.Director.EVENT_AFTER_UPDATE, this.sortAllChildren, this);
        }

        if (!destroyByParent) {
            // simulate some destruct logic to make undo system work correctly
            if (CC_EDITOR) {
                // ensure this node can reattach to scene by undo system
                this._parent = null;
            }
        }
    },

    _onPostActivated (active) {
        var actionManager = ActionManagerExist ? cc.director.getActionManager() : null;
        if (active) {
            // Refresh transform
            this._renderFlag |= RenderFlow.FLAG_WORLD_TRANSFORM;
            // ActionManager & EventManager
            actionManager && actionManager.resumeTarget(this);
            eventManager.resumeTarget(this);
            if (this._touchListener) {
                var mask = this._touchListener.mask = _searchMaskInParent(this);
                if (this._mouseListener) {
                    this._mouseListener.mask = mask;
                }
            }
            else if (this._mouseListener) {
                this._mouseListener.mask = _searchMaskInParent(this);
            }
        }
        else {
            // deactivate
            actionManager && actionManager.pauseTarget(this);
            eventManager.pauseTarget(this);
        }
    },

    _onHierarchyChanged (oldParent) {
        this._updateOrderOfArrival();
        if (this._parent) {
            this._parent._delaySort();
        }
        this._renderFlag |= RenderFlow.FLAG_WORLD_TRANSFORM;
        this._onHierarchyChangedBase(oldParent);
        if (cc._widgetManager) {
            cc._widgetManager._nodesOrderDirty = true;
        }
    },

    // INTERNAL

    _upgrade_1x_to_2x () {
        // Upgrade scaleX, scaleY from v1.x
        // TODO: remove in future version, 3.0 ?
        if (this._scaleX !== undefined) {
            this._scale.x = this._scaleX;
            this._scaleX = undefined;
        }
        if (this._scaleY !== undefined) {
            this._scale.y = this._scaleY;
            this._scaleY = undefined;
        }

        if (this._localZOrder !== 0) {
            this._zIndex = (this._localZOrder & 0xffff0000) >> 16;
        }

        // TODO: remove _rotationX & _rotationY in future version, 3.0 ?
        // Update quaternion from rotation, when upgrade from 1.x to 2.0
        // If rotation x & y is 0 in old version, then update rotation from default quaternion is ok too
        if (this._rotationX !== 0 || this._rotationY !== 0) {
            if (this._rotationX === this._rotationY) {
                math.quat.fromEuler(this._quat, 0, 0, -this._rotationX);
            }
            else {
                math.quat.fromEuler(this._quat, this._rotationX, this._rotationY, 0);
            }
        }
        // Update rotation from quaternion
        else {
            let rotx = this._quat.getRoll();
            let roty = this._quat.getPitch();
            if (rotx === 0 && roty === 0) {
                this._rotationX = this._rotationY = -this._quat.getYaw();
            }
            else {
                this._rotationX = rotx;
                this._rotationY = roty;
            }
        }

        // Upgrade from 2.0.0 preview 4 & earlier versions
        // TODO: Remove after final version
        if (this._color.a < 255 && this._opacity === 255) {
            this._opacity = this._color.a;
            this._color.a = 255;
        }
    },

    /*
     * The initializer for Node which will be called before all components onLoad
     */
    _onBatchCreated () {
        this._upgrade_1x_to_2x();

        this._updateOrderOfArrival();

        let prefabInfo = this._prefab;
        if (prefabInfo && prefabInfo.sync && prefabInfo.root === this) {
            if (CC_DEV) {
                // TODO - remove all usage of _synced
                cc.assert(!prefabInfo._synced, 'prefab should not synced');
            }
            PrefabHelper.syncWithPrefab(this);
        }

        if (!this._activeInHierarchy) {
            // deactivate ActionManager and EventManager by default
            if (ActionManagerExist) {
                cc.director.getActionManager().pauseTarget(this);
            }
            eventManager.pauseTarget(this);
        }

        let children = this._children;
        for (let i = 0, len = children.length; i < len; i++) {
            children[i]._onBatchCreated();
        }

        if (children.length > 0) {
            this._renderFlag |= RenderFlow.FLAG_CHILDREN;
        }
    },

    // the same as _onBatchCreated but untouch prefab
    _onBatchRestored () {
        this._upgrade_1x_to_2x();

        if (!this._activeInHierarchy) {
            // deactivate ActionManager and EventManager by default
            if (ActionManagerExist) {
                cc.director.getActionManager().pauseTarget(this);
            }
            eventManager.pauseTarget(this);
        }

        var children = this._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i]._onBatchRestored();
        }

        if (children.length > 0) {
            this._renderFlag |= RenderFlow.FLAG_CHILDREN;
        }
    },

    // EVENT TARGET

    _checknSetupSysEvent (type) {
        let newAdded = false;
        let forDispatch = false;
        if (_touchEvents.indexOf(type) !== -1) {
            if (!this._touchListener) {
                this._touchListener = cc.EventListener.create({
                    event: cc.EventListener.TOUCH_ONE_BY_ONE,
                    swallowTouches: true,
                    owner: this,
                    mask: _searchMaskInParent(this),
                    onTouchBegan: _touchStartHandler,
                    onTouchMoved: _touchMoveHandler,
                    onTouchEnded: _touchEndHandler,
                    onTouchCancelled: _touchCancelHandler
                });
                eventManager.addListener(this._touchListener, this);
                newAdded = true;
            }
            forDispatch = true;
        }
        else if (_mouseEvents.indexOf(type) !== -1) {
            if (!this._mouseListener) {
                this._mouseListener = cc.EventListener.create({
                    event: cc.EventListener.MOUSE,
                    _previousIn: false,
                    owner: this,
                    mask: _searchMaskInParent(this),
                    onMouseDown: _mouseDownHandler,
                    onMouseMove: _mouseMoveHandler,
                    onMouseUp: _mouseUpHandler,
                    onMouseScroll: _mouseWheelHandler,
                });
                eventManager.addListener(this._mouseListener, this);
                newAdded = true;
            }
            forDispatch = true;
        }
        if (newAdded && !this._activeInHierarchy) {
            cc.director.getScheduler().schedule(function () {
                if (!this._activeInHierarchy) {
                    eventManager.pauseTarget(this);
                }
            }, this, 0, 0, 0, false);
        }
        return forDispatch;
    },

    /**
     * !#en
     * Register a callback of a specific event type on Node.<br/>
     * Use this method to register touch or mouse event permit propagation based on scene graph,<br/>
     * These kinds of event are triggered with dispatchEvent, the dispatch process has three steps:<br/>
     * 1. Capturing phase: dispatch in capture targets (`_getCapturingTargets`), e.g. parents in node tree, from root to the real target<br/>
     * 2. At target phase: dispatch to the listeners of the real target<br/>
     * 3. Bubbling phase: dispatch in bubble targets (`_getBubblingTargets`), e.g. parents in node tree, from the real target to root<br/>
     * In any moment of the dispatching process, it can be stopped via `event.stopPropagation()` or `event.stopPropagationImmidiate()`.<br/>
     * It's the recommended way to register touch/mouse event for Node,<br/>
     * please do not use cc.eventManager directly for Node.<br/>
     * You can also register custom event and use `emit` to trigger custom event on Node.<br/>
     * For such events, there won't be capturing and bubbling phase, your event will be dispatched directly to its listeners registered on the same node.<br/>
     * You can also pass event callback parameters with `emit` by passing parameters after `type`.
     * !#zh
     * ??????????????????????????????????????????????????????????????? target ??????????????????????????? this ?????????<br/>
     * ??????????????????????????????????????? dispatchEvent ???????????????????????????????????????????????????<br/>
     * 1. ??????????????????????????????????????????????????? `_getCapturingTargets` ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????<br/>
     * 2. ???????????????????????????????????????????????????<br/>
     * 3. ??????????????????????????????????????????????????? `_getBubblingTargets` ??????????????????????????????????????????????????????????????????????????????????????????????????????????????????<br/>
     * ???????????????????????????????????????????????????????????? stopPropagation ????????????<br/>
     * ?????????????????????????????????????????????????????????????????????????????????????????????????????? cc.eventManager???<br/>
     * ????????????????????????????????????????????????????????? emit ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????<br/>
     * ?????????????????? emit ?????????????????? type ????????????????????????????????????????????????????????????
     * @method on
     * @param {String|Node.EventType} type - A string representing the event type to listen for.<br>See {{#crossLink "Node/EventTyupe/POSITION_CHANGED"}}Node Events{{/crossLink}} for all builtin events.
     * @param {Function} callback - The callback that will be invoked when the event is dispatched. The callback is ignored if it is a duplicate (the callbacks are unique).
     * @param {Event|any} [callback.event] event or first argument when emit
     * @param {any} [callback.arg2] arg2
     * @param {any} [callback.arg3] arg3
     * @param {any} [callback.arg4] arg4
     * @param {any} [callback.arg5] arg5
     * @param {Object} [target] - The target (this object) to invoke the callback, can be null
     * @param {Boolean} [useCapture=false] - When set to true, the listener will be triggered at capturing phase which is ahead of the final target emit, otherwise it will be triggered during bubbling phase.
     * @return {Function} - Just returns the incoming callback so you can save the anonymous function easier.
     * @typescript
     * on<T extends Function>(type: string, callback: T, target?: any, useCapture?: boolean): T
     * @example
     * this.node.on(cc.Node.EventType.TOUCH_START, this.memberFunction, this);  // if "this" is component and the "memberFunction" declared in CCClass.
     * node.on(cc.Node.EventType.TOUCH_START, callback, this);
     * node.on(cc.Node.EventType.TOUCH_MOVE, callback, this);
     * node.on(cc.Node.EventType.TOUCH_END, callback, this);
     * node.on(cc.Node.EventType.TOUCH_CANCEL, callback, this);
     * node.on(cc.Node.EventType.ANCHOR_CHANGED, callback);
     */
    on (type, callback, target, useCapture) {
        let forDispatch = this._checknSetupSysEvent(type);
        if (forDispatch) {
            return this._onDispatch(type, callback, target, useCapture);
        }
        else {
            switch (type) {
                case EventType.POSITION_CHANGED:
                this._eventMask |= POSITION_ON;
                break;
                case EventType.SCALE_CHANGED:
                this._eventMask |= SCALE_ON;
                break;
                case EventType.ROTATION_CHANGED:
                this._eventMask |= ROTATION_ON;
                break;
                case EventType.SIZE_CHANGED:
                this._eventMask |= SIZE_ON;
                break;
                case EventType.ANCHOR_CHANGED:
                this._eventMask |= ANCHOR_ON;
                break;
            }
            if (!this._bubblingListeners) {
                this._bubblingListeners = new EventTarget();
            }
            return this._bubblingListeners.on(type, callback, target);
        }
    },

    /**
     * !#en
     * Register an callback of a specific event type on the Node,
     * the callback will remove itself after the first time it is triggered.
     * !#zh
     * ?????????????????????????????????????????????????????????????????????????????????????????????
     *
     * @method once
     * @param {String} type - A string representing the event type to listen for.
     * @param {Function} callback - The callback that will be invoked when the event is dispatched.
     *                              The callback is ignored if it is a duplicate (the callbacks are unique).
     * @param {Event|any} [callback.event] event or first argument when emit
     * @param {any} [callback.arg2] arg2
     * @param {any} [callback.arg3] arg3
     * @param {any} [callback.arg4] arg4
     * @param {any} [callback.arg5] arg5
     * @param {Object} [target] - The target (this object) to invoke the callback, can be null
     * @typescript
     * once<T extends Function>(type: string, callback: T, target?: any, useCapture?: boolean): T
     * @example
     * node.once(cc.Node.EventType.ANCHOR_CHANGED, callback);
     */
    once (type, callback, target, useCapture) {
        let forDispatch = this._checknSetupSysEvent(type);
        let eventType_hasOnceListener = '__ONCE_FLAG:' + type;

        let listeners = null;
        if (forDispatch && useCapture) {
            listeners = this._capturingListeners = this._capturingListeners || new EventTarget();
        }
        else {
            listeners = this._bubblingListeners = this._bubblingListeners || new EventTarget();
        }

        let hasOnceListener = listeners.hasEventListener(eventType_hasOnceListener, callback, target);
        if (!hasOnceListener) {
            let self = this;
            let onceWrapper = function (arg1, arg2, arg3, arg4, arg5) {
                self.off(type, onceWrapper, target);
                listeners.remove(eventType_hasOnceListener, callback, target);
                callback.call(this, arg1, arg2, arg3, arg4, arg5);
            };
            this.on(type, onceWrapper, target);
            listeners.add(eventType_hasOnceListener, callback, target);
        }
    },

    _onDispatch (type, callback, target, useCapture) {
        // Accept also patameters like: (type, callback, useCapture)
        if (typeof target === 'boolean') {
            useCapture = target;
            target = undefined;
        }
        else useCapture = !!useCapture;
        if (!callback) {
            cc.errorID(6800);
            return;
        }

        var listeners = null;
        if (useCapture) {
            listeners = this._capturingListeners = this._capturingListeners || new EventTarget();
        }
        else {
            listeners = this._bubblingListeners = this._bubblingListeners || new EventTarget();
        }

        if ( !listeners.hasEventListener(type, callback, target) ) {
            listeners.add(type, callback, target);

            if (target && target.__eventTargets)
                target.__eventTargets.push(this);
        }

        return callback;
    },

    /**
     * !#en
     * Removes the callback previously registered with the same type, callback, target and or useCapture.
     * This method is merely an alias to removeEventListener.
     * !#zh ????????????????????????????????????????????? useCapture ??????????????????
     * @method off
     * @param {String} type - A string representing the event type being removed.
     * @param {Function} [callback] - The callback to remove.
     * @param {Object} [target] - The target (this object) to invoke the callback, if it's not given, only callback without target will be removed
     * @param {Boolean} [useCapture=false] - When set to true, the listener will be triggered at capturing phase which is ahead of the final target emit, otherwise it will be triggered during bubbling phase.
     * @example
     * this.node.off(cc.Node.EventType.TOUCH_START, this.memberFunction, this);
     * node.off(cc.Node.EventType.TOUCH_START, callback, this.node);
     * node.off(cc.Node.EventType.ANCHOR_CHANGED, callback, this);
     */
    off (type, callback, target, useCapture) {
        let touchEvent = _touchEvents.indexOf(type) !== -1;
        let mouseEvent = !touchEvent && _mouseEvents.indexOf(type) !== -1;
        if (touchEvent || mouseEvent) {
            this._offDispatch(type, callback, target, useCapture);

            if (touchEvent) {
                if (this._touchListener && !_checkListeners(this, _touchEvents)) {
                    eventManager.removeListener(this._touchListener);
                    this._touchListener = null;
                }
            }
            else if (mouseEvent) {
                if (this._mouseListener && !_checkListeners(this, _mouseEvents)) {
                    eventManager.removeListener(this._mouseListener);
                    this._mouseListener = null;
                }
            }
        }
        else if (this._bubblingListeners) {
            this._bubblingListeners.off(type, callback, target);

            var hasListeners = this._bubblingListeners.hasEventListener(type);
            // All listener removed
            if (!hasListeners) {
                switch (type) {
                    case EventType.POSITION_CHANGED:
                    this._eventMask &= ~POSITION_ON;
                    break;
                    case EventType.SCALE_CHANGED:
                    this._eventMask &= ~SCALE_ON;
                    break;
                    case EventType.ROTATION_CHANGED:
                    this._eventMask &= ~ROTATION_ON;
                    break;
                    case EventType.SIZE_CHANGED:
                    this._eventMask &= ~SIZE_ON;
                    break;
                    case EventType.ANCHOR_CHANGED:
                    this._eventMask &= ~ANCHOR_ON;
                    break;
                }
            }
        }
    },

    _offDispatch (type, callback, target, useCapture) {
        // Accept also patameters like: (type, callback, useCapture)
        if (typeof target === 'boolean') {
            useCapture = target;
            target = undefined;
        }
        else useCapture = !!useCapture;
        if (!callback) {
            this._capturingListeners && this._capturingListeners.removeAll(type);
            this._bubblingListeners && this._bubblingListeners.removeAll(type);
        }
        else {
            var listeners = useCapture ? this._capturingListeners : this._bubblingListeners;
            if (listeners) {
                listeners.remove(type, callback, target);
    
                if (target && target.__eventTargets) {
                    js.array.fastRemove(target.__eventTargets, this);
                }
            }
            
        }
    },

    /**
     * !#en Removes all callbacks previously registered with the same target.
     * !#zh ???????????????????????????????????????
     * @method targetOff
     * @param {Object} target - The target to be searched for all related callbacks
     * @example
     * node.targetOff(target);
     */
    targetOff (target) {
        let listeners = this._bubblingListeners;
        if (listeners) {
            listeners.targetOff(target);

            // Check for event mask reset
            if ((this._eventMask & POSITION_ON) && !listeners.hasEventListener(EventType.POSITION_CHANGED)) {
                this._eventMask &= ~POSITION_ON;
            }
            if ((this._eventMask & SCALE_ON) && !listeners.hasEventListener(EventType.SCALE_CHANGED)) {
                this._eventMask &= ~SCALE_ON;
            }
            if ((this._eventMask & ROTATION_ON) && !listeners.hasEventListener(EventType.ROTATION_CHANGED)) {
                this._eventMask &= ~ROTATION_ON;
            }
            if ((this._eventMask & SIZE_ON) && !listeners.hasEventListener(EventType.SIZE_CHANGED)) {
                this._eventMask &= ~SIZE_ON;
            }
            if ((this._eventMask & ANCHOR_ON) && !listeners.hasEventListener(EventType.ANCHOR_CHANGED)) {
                this._eventMask &= ~ANCHOR_ON;
            }
        }
        if (this._capturingListeners) {
            this._capturingListeners.targetOff(target);
        }

        if (this._touchListener && !_checkListeners(this, _touchEvents)) {
            eventManager.removeListener(this._touchListener);
            this._touchListener = null;
        }
        if (this._mouseListener && !_checkListeners(this, _mouseEvents)) {
            eventManager.removeListener(this._mouseListener);
            this._mouseListener = null;
        }
    },

    /**
     * !#en Checks whether the EventTarget object has any callback registered for a specific type of event.
     * !#zh ???????????????????????????????????????????????????????????????????????????
     * @method hasEventListener
     * @param {String} type - The type of event.
     * @return {Boolean} True if a callback of the specified type is registered; false otherwise.
     */
    hasEventListener (type) {
        let has = false;
        if (this._bubblingListeners) {
            has = this._bubblingListeners.hasEventListener(type);
        }
        if (!has && this._capturingListeners) {
            has = this._capturingListeners.hasEventListener(type);
        }
        return has;
    },

    /**
     * !#en
     * Trigger an event directly with the event name and necessary arguments.
     * !#zh
     * ????????????????????????????????????
     *
     * @method emit
     * @param {String} type - event type
     * @param {*} [arg1] - First argument in callback
     * @param {*} [arg2] - Second argument in callback
     * @param {*} [arg3] - Third argument in callback
     * @param {*} [arg4] - Fourth argument in callback
     * @param {*} [arg5] - Fifth argument in callback
     * @example
     * 
     * eventTarget.emit('fire', event);
     * eventTarget.emit('fire', message, emitter);
     */
    emit (type, arg1, arg2, arg3, arg4, arg5) {
        if (this._bubblingListeners) {
            this._bubblingListeners.emit(type, arg1, arg2, arg3, arg4, arg5);
        }
    },

    /**
     * !#en
     * Dispatches an event into the event flow.
     * The event target is the EventTarget object upon which the dispatchEvent() method is called.
     * !#zh ??????????????????????????????
     *
     * @method dispatchEvent
     * @param {Event} event - The Event object that is dispatched into the event flow
     */
    dispatchEvent (event) {
        _doDispatchEvent(this, event);
        _cachedArray.length = 0;
    },

    /**
     * !#en Pause node related system events registered with the current Node. Node system events includes touch and mouse events.
     * If recursive is set to true, then this API will pause the node system events for the node and all nodes in its sub node tree.
     * Reference: http://cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/internal-events/
     * !#zh ?????????????????????????????????????????????????????????????????????????????????????????????????????????
     * ???????????? recursive ??? true??????????????? API ????????????????????????????????????????????????????????????????????????
     * ?????????http://cocos.com/docs/creator/scripting/internal-events.html
     * @method pauseSystemEvents
     * @param {Boolean} recursive - Whether to pause node system events on the sub node tree.
     * @example
     * node.pauseSystemEvents(true);
     */
    pauseSystemEvents (recursive) {
        eventManager.pauseTarget(this, recursive);
    },

    /**
     * !#en Resume node related system events registered with the current Node. Node system events includes touch and mouse events.
     * If recursive is set to true, then this API will resume the node system events for the node and all nodes in its sub node tree.
     * Reference: http://cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/internal-events/
     * !#zh ?????????????????????????????????????????????????????????????????????????????????????????????????????????
     * ???????????? recursive ??? true??????????????? API ????????????????????????????????????????????????????????????????????????
     * ?????????http://cocos.com/docs/creator/scripting/internal-events.html
     * @method resumeSystemEvents
     * @param {Boolean} recursive - Whether to resume node system events on the sub node tree.
     * @example
     * node.resumeSystemEvents(true);
     */
    resumeSystemEvents (recursive) {
        eventManager.resumeTarget(this, recursive);
    },

    _hitTest (point, listener) {
        let w = this._contentSize.width,
            h = this._contentSize.height,
            cameraPt = _vec2a,
            testPt = _vec2b;
        
        let camera = cc.Camera.findCamera(this);
        if (camera) {
            camera.getCameraToWorldPoint(point, cameraPt);
        }
        else {
            cameraPt.set(point);
        }

        this._updateWorldMatrix();
        math.mat4.invert(_mat4_temp, this._worldMatrix);
        math.vec2.transformMat4(testPt, cameraPt, _mat4_temp);
        testPt.x += this._anchorPoint.x * w;
        testPt.y += this._anchorPoint.y * h;

        if (testPt.x >= 0 && testPt.y >= 0 && testPt.x <= w && testPt.y <= h) {
            if (listener && listener.mask) {
                var mask = listener.mask;
                var parent = this;
                for (var i = 0; parent && i < mask.index; ++i, parent = parent.parent) {
                }
                // find mask parent, should hit test it
                if (parent === mask.node) {
                    var comp = parent.getComponent(cc.Mask);
                    return (comp && comp.enabledInHierarchy) ? comp._hitTest(cameraPt) : true;
                }
                // mask parent no longer exists
                else {
                    listener.mask = null;
                    return true;
                }
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    },

    /**
     * Get all the targets listening to the supplied type of event in the target's capturing phase.
     * The capturing phase comprises the journey from the root to the last node BEFORE the event target's node.
     * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
     *
     * Subclasses can override this method to make event propagable.
     * @method _getCapturingTargets
     * @private
     * @param {String} type - the event type
     * @param {Array} array - the array to receive targets
     * @example {@link cocos2d/core/event/_getCapturingTargets.js}
     */
    _getCapturingTargets (type, array) {
        var parent = this.parent;
        while (parent) {
            if (parent._capturingListeners && parent._capturingListeners.hasEventListener(type)) {
                array.push(parent);
            }
            parent = parent.parent;
        }
    },
    
    /**
     * Get all the targets listening to the supplied type of event in the target's bubbling phase.
     * The bubbling phase comprises any SUBSEQUENT nodes encountered on the return trip to the root of the tree.
     * The result should save in the array parameter, and MUST SORT from child nodes to parent nodes.
     *
     * Subclasses can override this method to make event propagable.
     * @method _getBubblingTargets
     * @private
     * @param {String} type - the event type
     * @param {Array} array - the array to receive targets
     */
    _getBubblingTargets (type, array) {
        var parent = this.parent;
        while (parent) {
            if (parent._bubblingListeners && parent._bubblingListeners.hasEventListener(type)) {
                array.push(parent);
            }
            parent = parent.parent;
        }
    },

// ACTIONS
    /**
     * !#en
     * Executes an action, and returns the action that is executed.<br/>
     * The node becomes the action's target. Refer to cc.Action's getTarget() <br/>
     * Calling runAction while the node is not active won't have any effect. <br/>
     * Note???You shouldn't modify the action after runAction, that won't take any effect.<br/>
     * if you want to modify, when you define action plus.
     * !#zh
     * ???????????????????????????????????????????????????????????????????????????<br/>
     * ?????? runAction ??????????????????????????????????????????????????????????????????<br/>
     * ??????????????????????????? runAction ??????????????????????????????????????????????????????????????????????????? action ????????????
     * @method runAction
     * @param {Action} action
     * @return {Action} An Action pointer
     * @example
     * var action = cc.scaleTo(0.2, 1, 0.6);
     * node.runAction(action);
     * node.runAction(action).repeatForever(); // fail
     * node.runAction(action.repeatForever()); // right
     */
    runAction: ActionManagerExist ? function (action) {
        if (!this.active)
            return;
        cc.assertID(action, 1618);

        cc.director.getActionManager().addAction(action, this, false);
        return action;
    } : emptyFunc,

    /**
     * !#en Pause all actions running on the current node. Equals to `cc.director.getActionManager().pauseTarget(node)`.
     * !#zh ??????????????????????????????????????????????????? `cc.director.getActionManager().pauseTarget(node);` ?????????
     * @method pauseAllActions
     * @example
     * node.pauseAllActions();
     */
    pauseAllActions: ActionManagerExist ? function () {
        cc.director.getActionManager().pauseTarget(this);
    } : emptyFunc,

    /**
     * !#en Resume all paused actions on the current node. Equals to `cc.director.getActionManager().resumeTarget(node)`.
     * !#zh ??????????????????????????????????????????????????? `cc.director.getActionManager().resumeTarget(node);` ?????????
     * @method resumeAllActions
     * @example
     * node.resumeAllActions();
     */
    resumeAllActions: ActionManagerExist ? function () {
        cc.director.getActionManager().resumeTarget(this);
    } : emptyFunc,

    /**
     * !#en Stops and removes all actions from the running action list .
     * !#zh ??????????????????????????????????????????????????????
     * @method stopAllActions
     * @example
     * node.stopAllActions();
     */
    stopAllActions: ActionManagerExist ? function () {
        cc.director.getActionManager().removeAllActionsFromTarget(this);
    } : emptyFunc,

    /**
     * !#en Stops and removes an action from the running action list.
     * !#zh ?????????????????????????????????
     * @method stopAction
     * @param {Action} action An action object to be removed.
     * @example
     * var action = cc.scaleTo(0.2, 1, 0.6);
     * node.stopAction(action);
     */
    stopAction: ActionManagerExist ? function (action) {
        cc.director.getActionManager().removeAction(action);
    } : emptyFunc,

    /**
     * !#en Removes an action from the running action list by its tag.
     * !#zh ??????????????????????????????????????????
     * @method stopActionByTag
     * @param {Number} tag A tag that indicates the action to be removed.
     * @example
     * node.stopAction(1);
     */
    stopActionByTag: ActionManagerExist ? function (tag) {
        if (tag === cc.Action.TAG_INVALID) {
            cc.logID(1612);
            return;
        }
        cc.director.getActionManager().removeActionByTag(tag, this);
    } : emptyFunc,

    /**
     * !#en Returns an action from the running action list by its tag.
     * !#zh ?????????????????????????????????
     * @method getActionByTag
     * @see cc.Action#getTag and cc.Action#setTag
     * @param {Number} tag
     * @return {Action} The action object with the given tag.
     * @example
     * var action = node.getActionByTag(1);
     */
    getActionByTag: ActionManagerExist ? function (tag) {
        if (tag === cc.Action.TAG_INVALID) {
            cc.logID(1613);
            return null;
        }
        return cc.director.getActionManager().getActionByTag(tag, this);
    } : function () {
        return null;
    },

    /**
     * !#en
     * Returns the numbers of actions that are running plus the ones that are schedule to run (actions in actionsToAdd and actions arrays).<br/>
     *    Composable actions are counted as 1 action. Example:<br/>
     *    If you are running 1 Sequence of 7 actions, it will return 1. <br/>
     *    If you are running 7 Sequences of 2 actions, it will return 7.</p>
     * !#zh
     * ?????????????????????????????????????????????????????????????????????<br/>
     * ?????????<br/>
     * - ????????????????????? 7 ??????????????? 1 ??? Sequence??????????????? 1???<br/>
     * - ????????????????????? 2 ??????????????? 7 ??? Sequence??????????????? 7???<br/>
     *
     * @method getNumberOfRunningActions
     * @return {Number} The number of actions that are running plus the ones that are schedule to run
     * @example
     * var count = node.getNumberOfRunningActions();
     * cc.log("Running Action Count: " + count);
     */
    getNumberOfRunningActions: ActionManagerExist ? function () {
        return cc.director.getActionManager().getNumberOfRunningActionsInTarget(this);
    } : function () {
        return 0;
    },


// TRANSFORM RELATED
    /**
     * !#en Returns a copy of the position (x, y) of the node in its parent's coordinates.
     * !#zh ????????????????????????????????????????????????x, y??????
     * @method getPosition
     * @return {Vec2} The position (x, y) of the node in its parent's coordinates
     * @example
     * cc.log("Node Position: " + node.getPosition());
     */
    getPosition () {
        return new cc.Vec2(this._position);
    },

    /**
     * !#en
     * Sets the position (x, y) of the node in its parent's coordinates.<br/>
     * Usually we use cc.v2(x, y) to compose cc.Vec2 object.<br/>
     * and Passing two numbers (x, y) is more efficient than passing cc.Vec2 object.
     * !#zh
     * ????????????????????????????????????????????????<br/>
     * ??????????????????????????????????????????<br/>
     * 1. ?????? 2 ????????? x ??? y???<br/>
     * 2. ?????? cc.v2(x, y) ????????? cc.Vec2 ????????????
     * @method setPosition
     * @param {Vec2|Number} newPosOrX - X coordinate for position or the position (x, y) of the node in coordinates
     * @param {Number} [y] - Y coordinate for position
     * @example {@link cocos2d/core/utils/base-node/setPosition.js}
     */
    setPosition (newPosOrX, y) {
        var x;
        if (y === undefined) {
            x = newPosOrX.x;
            y = newPosOrX.y;
        }
        else {
            x = newPosOrX;
        }

        var locPosition = this._position;
        if (locPosition.x === x && locPosition.y === y) {
            return;
        }

        if (CC_EDITOR) {
            var oldPosition = new cc.Vec2(locPosition);
        }
        if (!CC_EDITOR || isFinite(x)) {
            locPosition.x = x;
        }
        else {
            return cc.error(ERR_INVALID_NUMBER, 'x of new position');
        }
        if (!CC_EDITOR || isFinite(y)) {
            locPosition.y = y;
        }
        else {	
            return cc.error(ERR_INVALID_NUMBER, 'y of new position');
        }
        this.setLocalDirty(LocalDirtyFlag.POSITION);
        this._renderFlag |= RenderFlow.FLAG_WORLD_TRANSFORM;

        // fast check event
        if (this._eventMask & POSITION_ON) {
            // send event
            if (CC_EDITOR) {
                this.emit(EventType.POSITION_CHANGED, oldPosition);
            }
            else {
                this.emit(EventType.POSITION_CHANGED);
            }
        }
    },

    /**
     * !#en
     * Returns the scale factor of the node.
     * Assertion will fail when scale x != scale y.
     * !#zh ??????????????????????????? X ?????? Y ?????????????????????????????????
     * @method getScale
     * @return {Number} The scale factor
     * @example
     * cc.log("Node Scale: " + node.getScale());
     */
    getScale () {
        if (this._scale.x !== this._scale.y)
            cc.logID(1603);
        return this._scale.x;
    },

    /**
     * !#en Sets the scale factor of the node. 1.0 is the default scale factor. This function can modify the X and Y scale at the same time.
     * !#zh ?????????????????????????????????????????? 1.0?????????????????????????????????????????? X ??? Y ?????????
     * @method setScale
     * @param {Number|Vec2} scaleX - scaleX or scale
     * @param {Number} [scaleY]
     * @example
     * node.setScale(cc.v2(1, 1));
     * node.setScale(1);
     */
    setScale (x, y) {
        if (x && typeof x !== 'number') {
            y = x.y;
            x = x.x;
        }
        else if (y === undefined) {
            y = x;
        }
        if (this._scale.x !== x || this._scale.y !== y) {
            this._scale.x = x;
            this._scale.y = y;
            this.setLocalDirty(LocalDirtyFlag.SCALE);
            this._renderFlag |= RenderFlow.FLAG_TRANSFORM;

            if (this._eventMask & SCALE_ON) {
                this.emit(EventType.SCALE_CHANGED);
            }
        }
    },

    /**
     * !#en Set rotation of node (along z axi).
     * !#zh ????????????????????????????????? Z ?????????????????????????????????
     * @method setRotation
     * @param {Number} rotation Degree rotation value
     */

    /**
     * !#en Get rotation of node (along z axi).
     * !#zh ????????????????????????????????? Z ?????????????????????????????????
     * @method getRotation
     * @param {Number} rotation Degree rotation value
     */

    /**
     * !#en
     * Returns a copy the untransformed size of the node. <br/>
     * The contentSize remains the same no matter the node is scaled or rotated.<br/>
     * All nodes has a size. Layer and Scene has the same size of the screen by default. <br/>
     * !#zh ?????????????????????????????????????????????????????????????????????????????????
     * @method getContentSize
     * @return {Size} The untransformed size of the node.
     * @example
     * cc.log("Content Size: " + node.getContentSize());
     */
    getContentSize () {
        return cc.size(this._contentSize.width, this._contentSize.height);
    },

    /**
     * !#en
     * Sets the untransformed size of the node.<br/>
     * The contentSize remains the same no matter the node is scaled or rotated.<br/>
     * All nodes has a size. Layer and Scene has the same size of the screen.
     * !#zh ?????????????????????????????????????????????????????????????????????????????????
     * @method setContentSize
     * @param {Size|Number} size - The untransformed size of the node or The untransformed size's width of the node.
     * @param {Number} [height] - The untransformed size's height of the node.
     * @example
     * node.setContentSize(cc.size(100, 100));
     * node.setContentSize(100, 100);
     */
    setContentSize (size, height) {
        var locContentSize = this._contentSize;
        var clone;
        if (height === undefined) {
            if ((size.width === locContentSize.width) && (size.height === locContentSize.height))
                return;
            if (CC_EDITOR) {
                clone = cc.size(locContentSize.width, locContentSize.height);
            }
            locContentSize.width = size.width;
            locContentSize.height = size.height;
        } else {
            if ((size === locContentSize.width) && (height === locContentSize.height))
                return;
            if (CC_EDITOR) {
                clone = cc.size(locContentSize.width, locContentSize.height);
            }
            locContentSize.width = size;
            locContentSize.height = height;
        }
        if (this._eventMask & SIZE_ON) {
            if (CC_EDITOR) {
                this.emit(EventType.SIZE_CHANGED, clone);
            }
            else {
                this.emit(EventType.SIZE_CHANGED);
            }
        }
    },

    /**
     * !#en
     * Returns a copy of the anchor point.<br/>
     * Anchor point is the point around which all transformations and positioning manipulations take place.<br/>
     * It's like a pin in the node where it is "attached" to its parent. <br/>
     * The anchorPoint is normalized, like a percentage. (0,0) means the bottom-left corner and (1,1) means the top-right corner. <br/>
     * But you can use values higher than (1,1) and lower than (0,0) too.  <br/>
     * The default anchor point is (0.5,0.5), so it starts at the center of the node.
     * !#zh
     * ??????????????????????????????????????????<br/>
     * ?????????????????????????????????????????????????????????????????????????????????????????????????????????<br/>
     * ????????????????????????????????????????????????(0???0) ??????????????????(1???1) ??????????????????<br/>
     * ???????????????????????????1???1???????????????????????????0???0??????????????????<br/>
     * ?????????????????????0.5???0.5????????????????????????????????????????????????<br/>
     * ?????????Creator ??????????????????????????????????????????????????????????????????????????????
     * @method getAnchorPoint
     * @return {Vec2} The anchor point of node.
     * @example
     * cc.log("Node AnchorPoint: " + node.getAnchorPoint());
     */
    getAnchorPoint () {
        return cc.v2(this._anchorPoint);
    },

    /**
     * !#en
     * Sets the anchor point in percent. <br/>
     * anchor point is the point around which all transformations and positioning manipulations take place. <br/>
     * It's like a pin in the node where it is "attached" to its parent. <br/>
     * The anchorPoint is normalized, like a percentage. (0,0) means the bottom-left corner and (1,1) means the top-right corner.<br/>
     * But you can use values higher than (1,1) and lower than (0,0) too.<br/>
     * The default anchor point is (0.5,0.5), so it starts at the center of the node.
     * !#zh
     * ???????????????????????????<br/>
     * ?????????????????????????????????????????????????????????????????????????????????????????????????????????<br/>
     * ????????????????????????????????????????????????(0???0) ??????????????????(1???1) ??????????????????<br/>
     * ???????????????????????????1???1???????????????????????????0???0??????????????????<br/>
     * ?????????????????????0.5???0.5????????????????????????????????????????????????<br/>
     * ?????????Creator ??????????????????????????????????????????????????????????????????????????????
     * @method setAnchorPoint
     * @param {Vec2|Number} point - The anchor point of node or The x axis anchor of node.
     * @param {Number} [y] - The y axis anchor of node.
     * @example
     * node.setAnchorPoint(cc.v2(1, 1));
     * node.setAnchorPoint(1, 1);
     */
    setAnchorPoint (point, y) {
        var locAnchorPoint = this._anchorPoint;
        if (y === undefined) {
            if ((point.x === locAnchorPoint.x) && (point.y === locAnchorPoint.y))
                return;
            locAnchorPoint.x = point.x;
            locAnchorPoint.y = point.y;
        } else {
            if ((point === locAnchorPoint.x) && (y === locAnchorPoint.y))
                return;
            locAnchorPoint.x = point;
            locAnchorPoint.y = y;
        }
        this.setLocalDirty(LocalDirtyFlag.POSITION);
        if (this._eventMask & ANCHOR_ON) {
            this.emit(EventType.ANCHOR_CHANGED);
        }
    },

    /*
     * Transforms position from world space to local space.
     * @method _invTransformPoint
     * @param {Vec3} out
     * @param {Vec3} vec3
     */
    _invTransformPoint (out, pos) {
        if (this._parent) {
            this._parent._invTransformPoint(out, pos);
        } else {
            math.vec3.copy(out, pos);
        }

        // out = parent_inv_pos - pos
        math.vec3.sub(out, out, this._position);

        // out = inv(rot) * out
        math.quat.conjugate(_quat_temp, this._quat);
        math.vec3.transformQuat(out, out, _quat_temp);

        // out = (1/scale) * out
        math.vec3.inverseSafe(_vec3_temp, this._scale);
        math.vec3.mul(out, out, _vec3_temp);

        return out;
    },
    
    /*
     * Calculate and return world position.
     * This is not a public API yet, its usage could be updated
     * @method getWorldPos
     * @param {Vec3} out
     * @return {Vec3}
     */
    getWorldPos (out) {
        math.vec3.copy(out, this._position);
        let curr = this._parent;
        while (curr) {
            // out = parent_scale * pos
            math.vec3.mul(out, out, curr._scale);
            // out = parent_quat * out
            math.vec3.transformQuat(out, out, curr._quat);
            // out = out + pos
            math.vec3.add(out, out, curr._position);
            curr = curr._parent;
        }
        return out;
    },

    /*
     * Set world position.
     * This is not a public API yet, its usage could be updated
     * @method setWorldPos
     * @param {Vec3} pos
     */
    setWorldPos (pos) {
        // NOTE: this is faster than invert world matrix and transform the point
        if (this._parent) {
            this._parent._invTransformPoint(this._position, pos);
        }
        else {
            math.vec3.copy(this._position, pos);
        }
        this.setLocalDirty(LocalDirtyFlag.POSITION);

        // fast check event
        if (this._eventMask & POSITION_ON) {
            // send event
            if (CC_EDITOR) {
                this.emit(EventType.POSITION_CHANGED, oldPosition);
            }
            else {
                this.emit(EventType.POSITION_CHANGED);
            }
        }
    },

    /*
     * Calculate and return world rotation
     * This is not a public API yet, its usage could be updated
     * @method getWorldRot
     * @param {Quat} out
     * @return {Quat}
     */
    getWorldRot (out) {
        math.quat.copy(out, this._quat);
        let curr = this._parent;
        while (curr) {
            math.quat.mul(out, curr._quat, out);
            curr = curr._parent;
        }
        return out;
    },

    /*
     * Set world rotation with quaternion
     * This is not a public API yet, its usage could be updated
     * @method setWorldRot
     * @param {Quat} rot
     */
    setWorldRot (quat) {
        if (this._parent) {
            this._parent.getWorldRot(this._quat);
            math.quat.conjugate(this._quat, this._quat);
            math.quat.mul(this._quat, this._quat, quat);
        }
        else {
            math.quat.copy(this._quat, quat);
        }
        this.setLocalDirty(LocalDirtyFlag.ROTATION);
    },

    getWorldRT (out) {
        let opos = _vec3_temp;
        let orot = _quat_temp;
        math.vec3.copy(opos, this._position);
        math.quat.copy(orot, this._quat);

        let curr = this._parent;
        while (curr) {
            // opos = parent_lscale * lpos
            math.vec3.mul(opos, opos, curr._scale);
            // opos = parent_lrot * opos
            math.vec3.transformQuat(opos, opos, curr._quat);
            // opos = opos + lpos
            math.vec3.add(opos, opos, curr._position);
            // orot = lrot * orot
            math.quat.mul(orot, curr._quat, orot);
            curr = curr._parent;
        }
        math.mat4.fromRT(out, orot, opos);
        return out;
    },

    /**
     * !#en Set rotation by lookAt target point, normally used by Camera Node
     * !#zh ??????????????????????????? rotation??????????????? Camera Node ???
     * @method lookAt
     * @param {Vec3} pos
     * @param {Vec3} [up] - default is (0,1,0)
     */
    lookAt (pos, up) {
        this.getWorldPos(_vec3_temp);
        math.vec3.sub(_vec3_temp, _vec3_temp, pos); // NOTE: we use -z for view-dir
        math.vec3.normalize(_vec3_temp, _vec3_temp);
        math.quat.fromViewUp(_quat_temp, _vec3_temp, up);
    
        this.setWorldRot(_quat_temp);
    },

    _updateLocalMatrix () {
        let dirtyFlag = this._localMatDirty;
        if (!dirtyFlag) return;

        // Update transform
        let t = this._matrix;
        //math.mat4.fromRTS(t, this._quat, this._position, this._scale);

        if (dirtyFlag & (LocalDirtyFlag.RT | LocalDirtyFlag.SKEW)) {
            let hasRotation = this._rotationX || this._rotationY;
            let hasSkew = this._skewX || this._skewY;
            let sx = this._scale.x, sy = this._scale.y;

            if (hasRotation || hasSkew) {
                let a = 1, b = 0, c = 0, d = 1;
                // rotation
                if (hasRotation) {
                    let rotationRadiansX = this._rotationX * ONE_DEGREE;
                    c = Math.sin(rotationRadiansX);
                    d = Math.cos(rotationRadiansX);
                    if (this._rotationY === this._rotationX) {
                        a = d;
                        b = -c;
                    }
                    else {
                        let rotationRadiansY = this._rotationY * ONE_DEGREE;
                        a = Math.cos(rotationRadiansY);
                        b = -Math.sin(rotationRadiansY);
                    }
                }
                // scale
                t.m00 = a *= sx;
                t.m01 = b *= sx;
                t.m04 = c *= sy;
                t.m05 = d *= sy;
                // skew
                if (hasSkew) {
                    let a = t.m00, b = t.m01, c = t.m04, d = t.m05;
                    let skx = Math.tan(this._skewX * ONE_DEGREE);
                    let sky = Math.tan(this._skewY * ONE_DEGREE);
                    if (skx === Infinity)
                        skx = 99999999;
                    if (sky === Infinity)
                        sky = 99999999;
                    t.m00 = a + c * sky;
                    t.m01 = b + d * sky;
                    t.m04 = c + a * skx;
                    t.m05 = d + b * skx;
                }
            }
            else {
                t.m00 = sx;
                t.m01 = 0;
                t.m04 = 0;
                t.m05 = sy;
            }
        }

        // position
        t.m12 = this._position.x;
        t.m13 = this._position.y;
        
        this._localMatDirty = 0;
        // Register dirty status of world matrix so that it can be recalculated
        this._worldMatDirty = true;
    },

    _calculWorldMatrix () {
        // Avoid as much function call as possible
        if (this._localMatDirty) {
            this._updateLocalMatrix();
        }
        
        // Assume parent world matrix is correct
        let parent = this._parent;
        if (parent) {
            let pt = parent._worldMatrix;
            let t = this._matrix;
            let wt = this._worldMatrix;
            let aa=t.m00, ab=t.m01, ac=t.m04, ad=t.m05, atx=t.m12, aty=t.m13;
            let ba=pt.m00, bb=pt.m01, bc=pt.m04, bd=pt.m05, btx=pt.m12, bty=pt.m13;
            if (bb !== 0 || bc !== 0) {
                wt.m00 = aa * ba + ab * bc;
                wt.m01 = aa * bb + ab * bd;
                wt.m04 = ac * ba + ad * bc;
                wt.m05 = ac * bb + ad * bd;
                wt.m12 = ba * atx + bc * aty + btx;
                wt.m13 = bb * atx + bd * aty + bty;
            }
            else {
                wt.m00 = aa * ba;
                wt.m01 = ab * bd;
                wt.m04 = ac * ba;
                wt.m05 = ad * bd;
                wt.m12 = ba * atx + btx;
                wt.m13 = bd * aty + bty;
            }
        }
        else {
            math.mat4.copy(this._worldMatrix, this._matrix);
        }
        this._worldMatDirty = false;
    },

    _updateWorldMatrix () {
        if (this._parent) {
            this._parent._updateWorldMatrix();
        }
        if (this._worldMatDirty) {
            this._calculWorldMatrix();
            // Sync dirty to children
            let children = this._children;
            for (let i = 0, l = children.length; i < l; i++) {
                children[i]._worldMatDirty = true;
            }
        }
    },

    setLocalDirty (flag) {
        this._localMatDirty = this._localMatDirty | flag;
        this._worldMatDirty = true;
    },

    setWorldDirty () {
        this._worldMatDirty = true;
    },

    /**
     * !#en
     * Get the local transform matrix (4x4), based on parent node coordinates
     * !#zh ??????????????????????????????????????????????????????????????????
     * @method getLocalMatrix
     * @param {Mat4} out The matrix object to be filled with data
     * @return {Mat4} Same as the out matrix object
     * @example
     * let mat4 = cc.mat4();
     * node.getLocalMatrix(mat4);
     */
    getLocalMatrix (out) {
        this._updateLocalMatrix();
        return math.mat4.copy(out, this._matrix);
    },
    
    /**
     * !#en
     * Get the world transform matrix (4x4)
     * !#zh ???????????????????????????????????????
     * @method getWorldMatrix
     * @param {Mat4} out The matrix object to be filled with data
     * @return {Mat4} Same as the out matrix object
     * @example
     * let mat4 = cc.mat4();
     * node.getWorldMatrix(mat4);
     */
    getWorldMatrix (out) {
        this._updateWorldMatrix();
        return math.mat4.copy(out, this._worldMatrix);
    },

    /**
     * !#en Converts a Point to node (local) space coordinates then add the anchor point position.
     * So the return position will be related to the left bottom corner of the node's bounding box.
     * This equals to the API behavior of cocos2d-x, you probably want to use convertToNodeSpaceAR instead
     * !#zh ??????????????????????????? (??????) ???????????????????????????????????????<br/>
     * ???????????????????????????????????????????????????????????????????????????<br/>
     * ?????? API ????????????????????? cocos2d-x ?????????????????????????????????????????????????????? convertToNodeSpaceAR???
     * @method convertToNodeSpace
     * @param {Vec2} worldPoint
     * @return {Vec2}
     * @example
     * var newVec2 = node.convertToNodeSpace(cc.v2(100, 100));
     */
    convertToNodeSpace (worldPoint) {
        this._updateWorldMatrix();
        math.mat4.invert(_mat4_temp, this._worldMatrix);
        let out = new cc.Vec2();
        math.vec2.transformMat4(out, worldPoint, _mat4_temp);
        out.x += this._anchorPoint.x * this._contentSize.width;
        out.y += this._anchorPoint.y * this._contentSize.height;
        return out;
    },

    /**
     * !#en Converts a Point related to the left bottom corner of the node's bounding box to world space coordinates.
     * This equals to the API behavior of cocos2d-x, you probably want to use convertToWorldSpaceAR instead
     * !#zh ?????????????????????????????????????????????????????????????????????????????????
     * ?????? API ????????????????????? cocos2d-x ?????????????????????????????????????????????????????? convertToWorldSpaceAR
     * @method convertToWorldSpace
     * @param {Vec2} nodePoint
     * @return {Vec2}
     * @example
     * var newVec2 = node.convertToWorldSpace(cc.v2(100, 100));
     */
    convertToWorldSpace (nodePoint) {
        this._updateWorldMatrix();
        let out = new cc.Vec2(
            nodePoint.x - this._anchorPoint.x * this._contentSize.width,
            nodePoint.y - this._anchorPoint.y * this._contentSize.height
        );
        return math.vec2.transformMat4(out, out, this._worldMatrix);
    },

    /**
     * !#en
     * Converts a Point to node (local) space coordinates in which the anchor point is the origin position.
     * !#zh
     * ??????????????????????????? (??????) ??????????????????????????????????????????????????????
     * @method convertToNodeSpaceAR
     * @param {Vec2} worldPoint
     * @return {Vec2}
     * @example
     * var newVec2 = node.convertToNodeSpaceAR(cc.v2(100, 100));
     */
    convertToNodeSpaceAR (worldPoint) {
        this._updateWorldMatrix();
        math.mat4.invert(_mat4_temp, this._worldMatrix);
        let out = new cc.Vec2();
        return math.vec2.transformMat4(out, worldPoint, _mat4_temp);
    },

    /**
     * !#en
     * Converts a Point in node coordinates to world space coordinates.
     * !#zh
     * ??????????????????????????????????????????????????????????????????
     * @method convertToWorldSpaceAR
     * @param {Vec2} nodePoint
     * @return {Vec2}
     * @example
     * var newVec2 = node.convertToWorldSpaceAR(cc.v2(100, 100));
     */
    convertToWorldSpaceAR (nodePoint) {
        this._updateWorldMatrix();
        let out = new cc.Vec2();
        return math.vec2.transformMat4(out, nodePoint, this._worldMatrix);
    },

// OLD TRANSFORM ACCESS APIs
    /**
     * !#en
     * Returns the matrix that transform the node's (local) space coordinates into the parent's space coordinates.<br/>
     * The matrix is in Pixels.
     * !#zh ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
     * @method getNodeToParentTransform
     * @deprecated since v2.0
     * @param {AffineTransform} [out] The affine transform object to be filled with data
     * @return {AffineTransform} Same as the out affine transform object
     * @example
     * let affineTransform = cc.AffineTransform.create();
     * node.getNodeToParentTransform(affineTransform);
     */
    getNodeToParentTransform (out) {
        if (!out) {
            out = AffineTrans.identity();
        }
        this._updateLocalMatrix();
               
        var contentSize = this._contentSize;
        _vec3_temp.x = -this._anchorPoint.x * contentSize.width;
        _vec3_temp.y = -this._anchorPoint.y * contentSize.height;

        math.mat4.copy(_mat4_temp, this._matrix);
        math.mat4.translate(_mat4_temp, _mat4_temp, _vec3_temp);
        return AffineTrans.fromMat4(out, _mat4_temp);
    },

    /**
     * !#en
     * Returns the matrix that transform the node's (local) space coordinates into the parent's space coordinates.<br/>
     * The matrix is in Pixels.<br/>
     * This method is AR (Anchor Relative).
     * !#zh
     * ???????????????????????????????????????????????????????????????????????????????????????????????????<br/>
     * ?????????????????????????????????<br/>
     * ??????????????????????????????
     * @method getNodeToParentTransformAR
     * @deprecated since v2.0
     * @param {AffineTransform} [out] The affine transform object to be filled with data
     * @return {AffineTransform} Same as the out affine transform object
     * @example
     * let affineTransform = cc.AffineTransform.create();
     * node.getNodeToParentTransformAR(affineTransform);
     */
    getNodeToParentTransformAR (out) {
        if (!out) {
            out = AffineTrans.identity();
        }
        this._updateLocalMatrix();
        return AffineTrans.fromMat4(out, this._matrix);
    },

    /**
     * !#en Returns the world affine transform matrix. The matrix is in Pixels.
     * !#zh ??????????????????????????????????????????????????????????????????????????????
     * @method getNodeToWorldTransform
     * @deprecated since v2.0
     * @param {AffineTransform} [out] The affine transform object to be filled with data
     * @return {AffineTransform} Same as the out affine transform object
     * @example
     * let affineTransform = cc.AffineTransform.create();
     * node.getNodeToWorldTransform(affineTransform);
     */
    getNodeToWorldTransform (out) {
        if (!out) {
            out = AffineTrans.identity();
        }
        this._updateWorldMatrix();
        
        var contentSize = this._contentSize;
        _vec3_temp.x = -this._anchorPoint.x * contentSize.width;
        _vec3_temp.y = -this._anchorPoint.y * contentSize.height;

        math.mat4.copy(_mat4_temp, this._worldMatrix);
        math.mat4.translate(_mat4_temp, _mat4_temp, _vec3_temp);

        return AffineTrans.fromMat4(out, _mat4_temp);
    },

    /**
     * !#en
     * Returns the world affine transform matrix. The matrix is in Pixels.<br/>
     * This method is AR (Anchor Relative).
     * !#zh
     * ????????????????????????????????????????????????????????????????????????<br/>
     * ??????????????????????????????
     * @method getNodeToWorldTransformAR
     * @deprecated since v2.0
     * @param {AffineTransform} [out] The affine transform object to be filled with data
     * @return {AffineTransform} Same as the out affine transform object
     * @example
     * let affineTransform = cc.AffineTransform.create();
     * node.getNodeToWorldTransformAR(affineTransform);
     */
    getNodeToWorldTransformAR (out) {
        if (!out) {
            out = AffineTrans.identity();
        }
        this._updateWorldMatrix();
        return AffineTrans.fromMat4(out, this._worldMatrix);
    },

    /**
     * !#en
     * Returns the matrix that transform parent's space coordinates to the node's (local) space coordinates.<br/>
     * The matrix is in Pixels. The returned transform is readonly and cannot be changed.
     * !#zh
     * ???????????????????????????????????????????????????????????????????????????????????????<br/>
     * ???????????????????????????????????????????????????????????????????????????
     * @method getParentToNodeTransform
     * @deprecated since v2.0
     * @param {AffineTransform} [out] The affine transform object to be filled with data
     * @return {AffineTransform} Same as the out affine transform object
     * @example
     * let affineTransform = cc.AffineTransform.create();
     * node.getParentToNodeTransform(affineTransform);
     */
    getParentToNodeTransform (out) {
        if (!out) {
            out = AffineTrans.identity();
        }
        this._updateLocalMatrix();
        math.mat4.invert(_mat4_temp, this._matrix);
        return AffineTrans.fromMat4(out, _mat4_temp);
    },

    /**
     * !#en Returns the inverse world affine transform matrix. The matrix is in Pixels.
     * !#en ??????????????????????????????????????????????????????
     * @method getWorldToNodeTransform
     * @deprecated since v2.0
     * @param {AffineTransform} [out] The affine transform object to be filled with data
     * @return {AffineTransform} Same as the out affine transform object
     * @example
     * let affineTransform = cc.AffineTransform.create();
     * node.getWorldToNodeTransform(affineTransform);
     */
    getWorldToNodeTransform (out) {
        if (!out) {
            out = AffineTrans.identity();
        }
        this._updateWorldMatrix();
        math.mat4.invert(_mat4_temp, this._worldMatrix);
        return AffineTrans.fromMat4(out, _mat4_temp);
    },

    /**
     * !#en convenience methods which take a cc.Touch instead of cc.Vec2.
     * !#zh ????????????????????????????????????????????????
     * @method convertTouchToNodeSpace
     * @deprecated since v2.0
     * @param {Touch} touch - The touch object
     * @return {Vec2}
     * @example
     * var newVec2 = node.convertTouchToNodeSpace(touch);
     */
    convertTouchToNodeSpace (touch) {
        return this.convertToNodeSpace(touch.getLocation());
    },

    /**
     * !#en converts a cc.Touch (world coordinates) into a local coordinate. This method is AR (Anchor Relative).
     * !#zh ???????????? cc.Touch????????????????????????????????????????????????????????????????????????
     * @method convertTouchToNodeSpaceAR
     * @deprecated since v2.0
     * @param {Touch} touch - The touch object
     * @return {Vec2}
     * @example
     * var newVec2 = node.convertTouchToNodeSpaceAR(touch);
     */
    convertTouchToNodeSpaceAR (touch) {
        return this.convertToNodeSpaceAR(touch.getLocation());
    },
    
    /**
     * !#en
     * Returns a "local" axis aligned bounding box of the node. <br/>
     * The returned box is relative only to its parent.
     * !#zh ??????????????????????????????????????????????????????
     * @method getBoundingBox
     * @return {Rect} The calculated bounding box of the node
     * @example
     * var boundingBox = node.getBoundingBox();
     */
    getBoundingBox () {
        this._updateLocalMatrix();
        let width = this._contentSize.width;
        let height = this._contentSize.height;
        let rect = cc.rect(
            -this._anchorPoint.x * width, 
            -this._anchorPoint.y * height, 
            width, 
            height);
        return rect.transformMat4(rect, this._matrix);
    },

    /**
     * !#en
     * Returns a "world" axis aligned bounding box of the node.<br/>
     * The bounding box contains self and active children's world bounding box.
     * !#zh
     * ???????????????????????????????????????????????????????????????AABB??????<br/>
     * ???????????????????????????????????????????????????????????????
     * @method getBoundingBoxToWorld
     * @return {Rect}
     * @example
     * var newRect = node.getBoundingBoxToWorld();
     */
    getBoundingBoxToWorld () {
        if (this._parent) {
            this._parent._updateWorldMatrix();
            return this._getBoundingBoxTo(this._parent._worldMatrix);
        }
        else {
            return this.getBoundingBox();
        }
    },

    _getBoundingBoxTo (parentMat) {
        this._updateLocalMatrix();
        let width = this._contentSize.width;
        let height = this._contentSize.height;
        let rect = cc.rect(
            -this._anchorPoint.x * width, 
            -this._anchorPoint.y * height, 
            width, 
            height);

        var parentMat = math.mat4.mul(this._worldMatrix, parentMat, this._matrix);
        rect.transformMat4(rect, parentMat);

        //query child's BoundingBox
        if (!this._children)
            return rect;

        var locChildren = this._children;
        for (var i = 0; i < locChildren.length; i++) {
            var child = locChildren[i];
            if (child && child.active) {
                var childRect = child._getBoundingBoxTo(parentMat);
                if (childRect)
                    rect.union(rect, childRect);
            }
        }
        return rect;
    },

    _updateOrderOfArrival () {
        var arrivalOrder = ++_globalOrderOfArrival;
        this._localZOrder = (this._localZOrder & 0xffff0000) | arrivalOrder;
    },

    /**
     * !#en
     * Adds a child to the node with z order and name.
     * !#zh
     * ???????????????????????????????????????????????? ?????? Z ??????????????????
     * @method addChild
     * @param {Node} child - A child node
     * @param {Number} [zIndex] - Z order for drawing priority. Please refer to zIndex property
     * @param {String} [name] - A name to identify the node easily. Please refer to name property
     * @example
     * node.addChild(newNode, 1, "node");
     */
    addChild (child, zIndex, name) {
        if (CC_DEV && !cc.Node.isNode(child)) {
            return cc.errorID(1634, cc.js.getClassName(child));
        }
        cc.assertID(child, 1606);
        cc.assertID(child._parent === null, 1605);

        // invokes the parent setter
        child.parent = this;

        if (zIndex !== undefined) {
            child.zIndex = zIndex;
        }
        if (name !== undefined) {
            child.name = name;
        }
    },

    /**
     * !#en Stops all running actions and schedulers.
     * !#zh ????????????????????????????????????????????????
     * @method cleanup
     * @example
     * node.cleanup();
     */
    cleanup () {
        // actions
        ActionManagerExist && cc.director.getActionManager().removeAllActionsFromTarget(this);
        // event
        eventManager.removeListeners(this);

        // children
        var i, len = this._children.length, node;
        for (i = 0; i < len; ++i) {
            node = this._children[i];
            if (node)
                node.cleanup();
        }
    },

    /**
     * !#en Sorts the children array depends on children's zIndex and arrivalOrder,
     * normally you won't need to invoke this function.
     * !#zh ?????????????????? zIndex ??? arrivalOrder ???????????????????????????????????????????????????????????????????????????
     *
     * @method sortAllChildren
     */
    sortAllChildren () {
        if (this._reorderChildDirty) {
            this._reorderChildDirty = false;
            var _children = this._children;
            if (_children.length > 1) {
                // insertion sort
                var len = _children.length, i, j, child;
                for (i = 1; i < len; i++) {
                    child = _children[i];
                    j = i - 1;

                    //continue moving element downwards while zOrder is smaller or when zOrder is the same but mutatedIndex is smaller
                    while (j >= 0) {
                        if (child._localZOrder < _children[j]._localZOrder) {
                            _children[j + 1] = _children[j];
                        } else {
                            break;
                        }
                        j--;
                    }
                    _children[j + 1] = child;
                }
                this.emit(EventType.CHILD_REORDER, this);
            }
            cc.director.__fastOff(cc.Director.EVENT_AFTER_UPDATE, this.sortAllChildren, this);
        }
    },

    _delaySort () {
        if (!this._reorderChildDirty) {
            this._reorderChildDirty = true;
            cc.director.__fastOn(cc.Director.EVENT_AFTER_UPDATE, this.sortAllChildren, this);
        }
    },

    _restoreProperties: CC_EDITOR && function () {
        /*
         * TODO: Refine this code after completing undo/redo 2.0.
         * The node will be destroyed when deleting in the editor,
         * but it will be reserved and reused for undo.
        */
        if (!this._matrix) {
            this._matrix = mathPools.mat4.get();
        }
        if (!this._worldMatrix) {
            this._worldMatrix = mathPools.mat4.get();
        }

        this._localMatDirty = LocalDirtyFlag.ALL;
        this._worldMatDirty = true;

        this._renderFlag |= RenderFlow.FLAG_TRANSFORM;
        if (this._renderComponent) {
            if (this._renderComponent.enabled) {
                this._renderFlag |= RenderFlow.FLAG_COLOR;
                this._renderComponent.markForUpdateRenderData(true);
            }
            else {
                this._renderComponent.disableRender();
            }
        }

        if (this._children.length > 0) {
            this._renderFlag |= RenderFlow.FLAG_CHILDREN;
        }
    },

    onRestore: CC_EDITOR && function () {
        this._onRestoreBase();

        this._restoreProperties();

        var actionManager = cc.director.getActionManager();
        if (this._activeInHierarchy) {
            actionManager && actionManager.resumeTarget(this);
            eventManager.resumeTarget(this);
        }
        else {
            actionManager && actionManager.pauseTarget(this);
            eventManager.pauseTarget(this);
        }
    },
});

/**
 * @event position-changed
 * @param {Vec2} oldPos - The old position, but this parameter is only available in editor!
 */
/**
 * @event size-changed
 * @param {Size} oldSize - The old size, but this parameter is only available in editor!
 */
/**
 * @event anchor-changed
 */
/**
 * @event child-added
 * @param {Node} child - child which have been added
 */
/**
 * @event child-removed
 * @param {Node} child - child which have been removed
 */
/**
 * @event child-reorder
 * @param {Node} node - node whose children have been reordered
 */
/**
 * @event group-changed
 * @param {Node} node - node whose group has changed
 */

// Deprecated APIs

/**
 * !#en
 * Returns the displayed opacity of Node,
 * the difference between displayed opacity and opacity is that displayed opacity is calculated based on opacity and parent node's opacity when cascade opacity enabled.
 * !#zh
 * ??????????????????????????????
 * ????????????????????????????????????????????????????????????????????????????????????
 * ????????????????????????????????????????????????????????????????????????
 *
 * @method getDisplayedOpacity
 * @returns {number} displayed opacity
 * @deprecated since v2.0, please use opacity property, cascade opacity is removed
 */

/**
 * !#en
 * Returns the displayed color of Node,
 * the difference between displayed color and color is that displayed color is calculated based on color and parent node's color when cascade color enabled.
 * !#zh
 * ??????????????????????????????
 * ???????????????????????????????????????????????????????????????????????????
 * ???????????????????????????????????????????????????????????????
 *
 * @method getDisplayedColor
 * @returns {Color}
 * @deprecated since v2.0, please use color property, cascade color is removed
 */

/**
 * !#en Cascade opacity is removed from v2.0
 * Indicate whether node's opacity value affect its child nodes, default value is true.
 * !#zh ???????????????????????? v2.0 ???????????????
 * ??????????????????????????????????????????????????????????????? true???
 * @property cascadeOpacity
 * @deprecated since v2.0
 * @type {Boolean}
 */

/**
 * !#en Cascade opacity is removed from v2.0
 * Returns whether node's opacity value affect its child nodes.
 * !#zh ???????????????????????? v2.0 ???????????????
 * ?????????????????????????????????????????????????????????
 * @method isCascadeOpacityEnabled
 * @deprecated since v2.0
 * @returns {Boolean}
 */

/**
 * !#en Cascade opacity is removed from v2.0
 * Enable or disable cascade opacity, if cascade enabled, child nodes' opacity will be the multiplication of parent opacity and its own opacity.
 * !#zh ???????????????????????? v2.0 ???????????????
 * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
 * @method setCascadeOpacityEnabled
 * @deprecated since v2.0
 * @param {Boolean} cascadeOpacityEnabled
 */

/**
 * !#en Opacity modify RGB have been removed since v2.0
 * Set whether color should be changed with the opacity value,
 * useless in ccsg.Node, but this function is override in some class to have such behavior.
 * !#zh ??????????????????????????????????????????
 * ????????????????????????????????????RGB??????
 * @method setOpacityModifyRGB
 * @deprecated since v2.0
 * @param {Boolean} opacityValue
 */

/**
 * !#en Opacity modify RGB have been removed since v2.0
 * Get whether color should be changed with the opacity value.
 * !#zh ??????????????????????????????????????????
 * ????????????????????????????????????RGB??????
 * @method isOpacityModifyRGB
 * @deprecated since v2.0
 * @return {Boolean}
 */

var SameNameGetSets = ['parent', 'position', 'scale', 'rotation'];
misc.propertyDefine(Node, SameNameGetSets);

cc.Node = module.exports = Node;
