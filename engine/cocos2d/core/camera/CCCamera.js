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

const AffineTrans = require('../utils/affine-transform');
const renderEngine = require('../renderer/render-engine');
const renderer = require('../renderer/index');
const game = require('../CCGame');

const mat4 = cc.vmath.mat4;
const vec2 = cc.vmath.vec2;
const vec3 = cc.vmath.vec3;

let _mat4_temp_1 = mat4.create();
let _mat4_temp_2 = mat4.create();
let _vec3_temp_1 = vec3.create();

let _cameras = [];

let _debugCamera = null;

function repositionDebugCamera () {
    if (!_debugCamera) return;

    let node = _debugCamera._node;
    let visibleRect = cc.visibleRect;
    node.z = visibleRect.height / 1.1566;
    node.x = _vec3_temp_1.x = visibleRect.width / 2;
    node.y = _vec3_temp_1.y = visibleRect.height / 2;
    _vec3_temp_1.z = 0;
    node.lookAt(_vec3_temp_1);
}

/**
 * !#en Values for Camera.clearFlags, determining what to clear when rendering a Camera.
 * !#zh ????????????????????????????????????????????????????????????????????????
 * @enum Camera.ClearFlags
 */
let ClearFlags = cc.Enum({
    COLOR: 1,
    DEPTH: 2,
    STENCIL: 4,
});

/**
 * !#en
 * Camera is usefull when making reel game or other games which need scroll screen.
 * Using camera will be more efficient than moving node to scroll screen.
 * Camera 
 * !#zh
 * ???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
 * @class Camera
 * @extends Component
 */
let Camera = cc.Class({
    name: 'cc.Camera',
    extends: cc.Component,
    
    ctor () {
        if (game.renderType !== game.RENDER_TYPE_CANVAS) {
            let camera = new renderEngine.Camera();

            camera.setStages([
                'transparent'
            ]);

            this._fov = Math.PI * 60 / 180;
            camera.setFov(this._fov);
            camera.setNear(0.1);
            camera.setFar(4096);

            let view = new renderEngine.View();
            camera.view = view;
            camera.dirty = true;

            this._matrixDirty = true;
            this._inited = false;
            this._camera = camera;
        }
        else {
            this._inited = true;
        }
    },

    editor: CC_EDITOR && {
        menu: 'i18n:MAIN_MENU.component.others/Camera',
        inspector: 'packages://inspector/inspectors/comps/camera.js',
        executeInEditMode: false
    },

    properties: {
        _cullingMask: 0xffffffff,
        _clearFlags: ClearFlags.DEPTH | ClearFlags.STENCIL,
        _backgroundColor: cc.color(0, 0, 0, 255),
        _depth: 0,
        _zoomRatio: 1,
        _targetTexture: null,

        /**
         * !#en
         * The camera zoom ratio.
         * !#zh
         * ?????????????????????
         * @property {Number} zoomRatio
         */
        zoomRatio: {
            get () {
                return this._zoomRatio;
            },
            set (value) {
                this._zoomRatio = value;
                this._matrixDirty = true;
            }
        },

        /**
         * !#en
         * This is used to render parts of the scene selectively.
         * !#zh
         * ????????????????????????????????????????????????
         * @property {Number} cullingMask
         */
        cullingMask: {
            get () {
                return this._cullingMask;
            },
            set (value) {
                this._cullingMask = value;
                this._updateCameraMask();
            }
        },

        /**
         * !#en
         * Determining what to clear when camera rendering.
         * !#zh
         * ????????????????????????????????????????????????
         * @property {Camera.ClearFlags} clearFlags
         */
        clearFlags: {
            get () {
                return this._clearFlags;
            },
            set (value) {
                this._clearFlags = value;
                if (this._camera) {
                    this._camera.setClearFlags(value);
                }
            }
        },

        /**
         * !#en
         * The color with which the screen will be cleared.
         * !#zh
         * ??????????????????????????????????????????
         * @property {Color} backgroundColor
         */
        backgroundColor: {
            get () {
                return this._backgroundColor;
            },
            set (value) {
                this._backgroundColor = value;
                this._updateBackgroundColor();
            }
        },

        /**
         * !#en
         * Camera's depth in the camera rendering order.
         * !#zh
         * ?????????????????????????????????????????????????????????
         * @property {Number} depth
         */
        depth: {
            get () {
                return this._depth;
            },
            set (value) {
                this._depth = value;
                if (this._camera) {
                    this._camera.setDepth(value);
                }
            }
        },

        /**
         * !#en
         * Destination render texture.
         * Usually cameras render directly to screen, but for some effects it is useful to make a camera render into a texture.
         * !#zh
         * ???????????????????????? RenderTexture???
         * ???????????????????????????????????????????????????????????????????????????????????????????????? RenderTexture ????????? RenderTexture ????????????????????????
         * @property {RenderTexture} targetTexture
         */
        targetTexture: {
            get () {
                return this._targetTexture;
            },
            set (value) {
                this._targetTexture = value;
                this._updateTargetTexture();
            }
        }
    },

    statics: {
        /**
         * !#en
         * The first enabled camera.
         * !#zh
         * ?????????????????????????????????
         * @property {Camera} main
         * @static
         */
        main: null,

        /**
         * !#en
         * All enabled cameras.
         * !#zh
         * ???????????????????????????
         * @property {[Camera]} cameras
         * @static
         */
        cameras: _cameras,

        ClearFlags: ClearFlags,

        /**
         * !#en
         * Get the first camera which the node belong to.
         * !#zh
         * ??????????????????????????????????????????
         * @method findCamera
         * @param {Node} node 
         * @return {Camera}
         * @static
         */
        findCamera (node) {
            for (let i = 0, l = _cameras.length; i < l; i++) {
                let camera = _cameras[i];
                if (camera.containsNode(node)) {
                    return camera;
                }
            }

            return null;
        },

        _setupDebugCamera () {
            if (_debugCamera) return;
            if (game.renderType === game.RENDER_TYPE_CANVAS) return;
            let camera = new renderEngine.Camera();
            _debugCamera = camera;
            
            camera.setStages([
                'transparent'
            ]);

            camera.setFov(Math.PI * 60 / 180);
            camera.setNear(0.1);
            camera.setFar(4096);

            let view = new renderEngine.View();
            camera.view = view;
            camera.dirty = true;

            camera._cullingMask = camera.view._cullingMask = 1 << cc.Node.BuiltinGroupIndex.DEBUG;
            camera.setDepth(cc.macro.MAX_ZINDEX);
            camera.setClearFlags(0);
            camera.setColor(0,0,0,0);

            let node = new cc.Node();
            camera.setNode(node);

            repositionDebugCamera();
            cc.view.on('design-resolution-changed', repositionDebugCamera);

            renderer.scene.addCamera(camera);
        }
    },

    _updateCameraMask () {
        if (this._camera) {
            let mask = this._cullingMask & (~(1 << cc.Node.BuiltinGroupIndex.DEBUG));
            this._camera._cullingMask = mask;
            this._camera.view._cullingMask = mask;
        }
    },

    _updateBackgroundColor () {
        if (this._camera) {
            let color = this._backgroundColor;
            this._camera.setColor(
                color.r / 255,
                color.g / 255,
                color.b / 255,
                color.a / 255,
            );
        }
    },

    _updateTargetTexture () {
        let texture = this._targetTexture;
        if (this._camera) {
            this._camera._framebuffer = texture ? texture._framebuffer : null;
        }
    },

    _onMatrixDirty () {
        this._matrixDirty = true;
    },

    _init () {
        if (this._inited) return;
        this._inited = true;

        if (this._camera) {
            this._camera.setNode(this.node);
            this._camera.setClearFlags(this._clearFlags);
            this._camera.setDepth(this._depth);
            this._updateBackgroundColor();
            this._updateCameraMask();
            this._updateTargetTexture();
        }
    },

    onLoad () {
        this._init();
    },

    onEnable () {
        this._matrixDirty = true;
        if (game.renderType !== game.RENDER_TYPE_CANVAS) {
            cc.director.on(cc.Director.EVENT_BEFORE_DRAW, this.beforeDraw, this);
            renderer.scene.addCamera(this._camera);
        }
        _cameras.push(this);
    },

    onDisable () {
        if (game.renderType !== game.RENDER_TYPE_CANVAS) {
            cc.director.off(cc.Director.EVENT_BEFORE_DRAW, this.beforeDraw, this);
            renderer.scene.removeCamera(this._camera);
        }
        cc.js.array.remove(_cameras, this);
    },

    /**
     * !#en
     * Returns the matrix that transform the node's (local) space coordinates into the camera's space coordinates.
     * !#zh
     * ?????????????????????????????????????????????????????????????????????
     * @method getNodeToCameraTransform
     * @param {Node} node - the node which should transform
     * @return {AffineTransform}
     */
    getNodeToCameraTransform (node) {
        let out = AffineTrans.identity();
        node.getWorldMatrix(_mat4_temp_2);
        if (this.containsNode(node)) {
            this.getWorldToCameraMatrix(_mat4_temp_1);
            mat4.mul(_mat4_temp_2, _mat4_temp_2, _mat4_temp_1);
        }
        AffineTrans.fromMat4(out, _mat4_temp_2);
        return out;
    },

    /**
     * !#en
     * Conver a camera coordinates point to world coordinates.
     * !#zh
     * ??????????????????????????????????????????????????????????????????
     * @method getCameraToWorldPoint
     * @param {Vec2} point - the point which should transform
     * @param {Vec2} out - the point to receive the result
     * @return {Vec2}
     */
    getCameraToWorldPoint (point, out) {
        out = out || cc.v2();
        this.getCameraToWorldMatrix(_mat4_temp_1);
        vec2.transformMat4(out, point, _mat4_temp_1);
        return out;
    },

    /**
     * !#en
     * Conver a world coordinates point to camera coordinates.
     * !#zh
     * ??????????????????????????????????????????????????????????????????
     * @method getWorldToCameraPoint
     * @param {Vec2} point 
     * @param {Vec2} out - the point to receive the result
     * @return {Vec2}
     */
    getWorldToCameraPoint (point, out) {
        out = out || cc.v2();
        this.getWorldToCameraMatrix(_mat4_temp_1);
        vec2.transformMat4(out, point, _mat4_temp_1);
        return out;
    },

    /**
     * !#en
     * Get the camera to world matrix
     * !#zh
     * ???????????????????????????????????????????????????
     * @method getCameraToWorldMatrix
     * @param {Mat4} out - the matrix to receive the result
     * @return {Mat4}
     */
    getCameraToWorldMatrix (out) {
        this.getWorldToCameraMatrix(out);
        mat4.invert(out, out);
        return out;
    },


    /**
     * !#en
     * Get the world to camera matrix
     * !#zh
     * ???????????????????????????????????????????????????
     * @method getWorldToCameraMatrix
     * @param {Mat4} out - the matrix to receive the result
     * @return {Mat4}
     */
    getWorldToCameraMatrix (out) {
        this.node.getWorldRT(_mat4_temp_1);

        let zoomRatio = this.zoomRatio;
        _mat4_temp_1.m00 *= zoomRatio;
        _mat4_temp_1.m01 *= zoomRatio;
        _mat4_temp_1.m04 *= zoomRatio;
        _mat4_temp_1.m05 *= zoomRatio;

        let m12 = _mat4_temp_1.m12;
        let m13 = _mat4_temp_1.m13;

        let center = cc.visibleRect.center;
        _mat4_temp_1.m12 = center.x - (_mat4_temp_1.m00 * m12 + _mat4_temp_1.m04 * m13);
        _mat4_temp_1.m13 = center.y - (_mat4_temp_1.m01 * m12 + _mat4_temp_1.m05 * m13);

        if (out !== _mat4_temp_1) {
            mat4.copy(out, _mat4_temp_1);
        }
        return out;
    },

    /**
     * !#en
     * Check whether the node is in the camera.
     * !#zh
     * ???????????????????????????????????????
     * @method containsNode
     * @param {Node} node - the node which need to check
     * @return {Boolean}
     */
    containsNode (node) {
        return node._cullingMask & this.cullingMask;
    },

    /**
     * !#en
     * Render the camera manually.
     * !#zh
     * ????????????????????????
     * @method render
     * @param {Node} root 
     */
    render (root) {
        root = root || cc.director.getScene();
        if (!root) return null;

        // force update node world matrix
        this.node.getWorldMatrix(_mat4_temp_1);
        this.beforeDraw();
        renderer._walker.visit(root);
        renderer._forward.renderCamera(this._camera, renderer.scene);
    },

    beforeDraw: function () {
        let node = this.node;
        
        if (!this._matrixDirty && !node._worldMatDirty)
            return;

        let camera = this._camera;
        let fov = Math.atan(Math.tan(this._fov/2) / this.zoomRatio)*2;
        camera.setFov(fov);

        let height = cc.game.canvas.height / cc.view._scaleY;

        let targetTexture = this._targetTexture;
        if (targetTexture) {
            height = targetTexture.height;
        }

        node._updateWorldMatrix();
        _vec3_temp_1.x = node._worldMatrix.m12;
        _vec3_temp_1.y = node._worldMatrix.m13;
        _vec3_temp_1.z = 0;

        node.z = height / 1.1566;
        node.lookAt(_vec3_temp_1);

        this._matrixDirty = false;
        camera.dirty = true;
    }
});

module.exports = cc.Camera = Camera;
