/****************************************************************************
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

var js = cc.js;
var Playable = require('./playable');
var DynamicAnimCurve = require('./animation-curves').DynamicAnimCurve;
var quickFindIndex = require('./animation-curves').quickFindIndex;
var sampleMotionPaths = require('./motion-path-helper').sampleMotionPaths;
var EventAnimCurve = require('./animation-curves').EventAnimCurve;
var EventInfo = require('./animation-curves').EventInfo;
var WrapModeMask = require('./types').WrapModeMask;
var binarySearch = require('../core/utils/binary-search').binarySearchEpsilon;

// The actual animator for Animation Component

function AnimationAnimator (target, animation) {
    Playable.call(this);
    this.target = target;
    this.animation = animation;

    this._anims = new js.array.MutableForwardIterator([]);
}
js.extend(AnimationAnimator, Playable);
var p = AnimationAnimator.prototype;

p.playState = function (state, startTime) {
    if (!state.clip) {
        return;
    }

    if (!state.curveLoaded) {
        initClipData(this.target, state);
    }

    state.animator = this;
    state.play();

    if (typeof startTime === 'number') {
        state.setTime(startTime);
    }

    this.play();
};

p.stopStatesExcept = function (state) {
    var iterator = this._anims;
    var array = iterator.array;
    for (iterator.i = 0; iterator.i < array.length; ++iterator.i) {
        var anim = array[iterator.i];
        if (anim === state) {
            continue;
        }

        this.stopState(anim);
    }
};

p.addAnimation = function (anim) {
    var index = this._anims.array.indexOf(anim);
    if (index === -1) {
        this._anims.push(anim);
    }

    anim._setListeners(this.animation);
};

p.removeAnimation = function (anim) {
    var index = this._anims.array.indexOf(anim);
    if (index >= 0) {
        this._anims.fastRemoveAt(index);

        if (this._anims.array.length === 0) {
            this.stop();
        }
    }
    else {
        cc.errorID(3908);
    }

    anim.animator = null;
};

p.sample = function () {
    var iterator = this._anims;
    var array = iterator.array;
    for (iterator.i = 0; iterator.i < array.length; ++iterator.i) {
        var anim = array[iterator.i];
        anim.sample();
    }
};

p.stopState = function (state) {
    if (state) {
        state.stop();
    }
};

p.pauseState = function (state) {
    if (state) {
        state.pause();
    }
};

p.resumeState = function (state) {
    if (state) {
        state.resume();
    }

    if (this.isPaused) {
        this.resume();
    }
};

p.setStateTime = function (state, time) {
    if (time !== undefined) {
        if (state) {
            state.setTime(time);
            state.sample();
        }    
    }
    else {
        time = state;

        var array = this._anims.array;
        for (var i = 0; i < array.length; ++i) {
            var anim = array[i];
            anim.setTime(time);
            anim.sample();
        }
    }
};

p.onStop = function () {
    var iterator = this._anims;
    var array = iterator.array;
    for (iterator.i = 0; iterator.i < array.length; ++iterator.i) {
        var anim = array[iterator.i];
        anim.stop();
    }
};

p.onPause = function () {
    var array = this._anims.array;
    for (var i = 0; i < array.length; ++i) {
        var anim = array[i];
        anim.pause();

        // need to unbind animator to anim, or it maybe cannot be gc.
        anim.animator = null;
    }
};

p.onResume = function () {
    var array = this._anims.array;
    for (var i = 0; i < array.length; ++i) {
        var anim = array[i];
        
        // rebind animator to anim
        anim.animator = this;

        anim.resume();
    }
};

p._reloadClip = function (state) {
    initClipData(this.target, state);
};

// 这个方法应该是 SampledAnimCurve 才能用
function createBatchedProperty (propPath, firstDotIndex, mainValue, animValue) {
    mainValue = mainValue.clone();
    var nextValue = mainValue;
    var leftIndex = firstDotIndex + 1;
    var rightIndex = propPath.indexOf('.', leftIndex);

    // scan property path
    while (rightIndex !== -1) {
        var nextName = propPath.slice(leftIndex, rightIndex);
        nextValue = nextValue[nextName];
        leftIndex = rightIndex + 1;
        rightIndex = propPath.indexOf('.', leftIndex);
    }
    var lastPropName = propPath.slice(leftIndex);
    nextValue[lastPropName] = animValue;

    return mainValue;
}

if (CC_TEST) {
    cc._Test.createBatchedProperty = createBatchedProperty;
}

function splitPropPath (propPath) {
    var array = propPath.split('.');
    array.shift();
    //array = array.filter(function (item) { return !!item; });
    return array.length > 0 ? array : null;
}


function initClipData (root, state) {
    var clip = state.clip;

    var curves = state.curves;
    curves.length = 0;

    state.duration = clip.duration;
    state.speed = clip.speed;
    state.wrapMode = clip.wrapMode;
    state.frameRate = clip.sample;

    if ((state.wrapMode & WrapModeMask.Loop) === WrapModeMask.Loop) {
        state.repeatCount = Infinity;
    }
    else {
        state.repeatCount = 1;
    }

    // create curves

    function checkMotionPath(motionPath) {
        if (!Array.isArray(motionPath)) return false;

        for (let i = 0, l = motionPath.length; i < l; i++) {
            var controls = motionPath[i];

            if (!Array.isArray(controls) || controls.length !== 6) return false;
        }

        return true;
    }

    function createPropCurve (target, propPath, keyframes) {
        var isMotionPathProp = (target instanceof cc.Node) && (propPath === 'position');
        var motionPaths = [];
        
        var curve = new DynamicAnimCurve();

        // 缓存目标对象，所以 Component 必须一开始都创建好并且不能运行时动态替换……
        curve.target = target;

        var propName, propValue;
        var dotIndex = propPath.indexOf('.');
        var hasSubProp = dotIndex !== -1;
        if (hasSubProp) {
            propName = propPath.slice(0, dotIndex);
            propValue = target[propName];

            // if (!(propValue instanceof cc.ValueType)) {
            //     cc.error('Only support sub animation property which is type cc.ValueType');
            //     continue;
            // }
        }
        else {
            propName = propPath;
        }

        curve.prop = propName;

        curve.subProps = splitPropPath(propPath);

        // for each keyframes
        for (let i = 0, l = keyframes.length; i < l; i++) {
            var keyframe = keyframes[i];
            var ratio = keyframe.frame / state.duration;
            curve.ratios.push(ratio);

            if (isMotionPathProp) {
                var motionPath = keyframe.motionPath;

                if (motionPath && !checkMotionPath(motionPath)) {
                    cc.errorID(3904, target.name, propPath, i);
                    motionPath = null;
                }

                motionPaths.push(motionPath);
            }

            var curveValue = keyframe.value;
            //if (hasSubProp) {
            //    curveValue = createBatchedProperty(propPath, dotIndex, propValue, curveValue);
            //}
            curve.values.push(curveValue);

            var curveTypes = keyframe.curve;
            if (curveTypes) {
                if (typeof curveTypes === 'string') {
                    curve.types.push(curveTypes);
                    continue;
                }
                else if (Array.isArray(curveTypes)) {
                    if (curveTypes[0] === curveTypes[1] &&
                        curveTypes[2] === curveTypes[3]) {
                        curve.types.push(DynamicAnimCurve.Linear);
                    }
                    else {
                        curve.types.push(DynamicAnimCurve.Bezier(curveTypes));
                    }
                    continue;
                }
            }
            curve.types.push(DynamicAnimCurve.Linear);
        }

        if (isMotionPathProp) {
            sampleMotionPaths(motionPaths, curve, clip.duration, clip.sample);
        }

        // if every piece of ratios are the same, we can use the quick function to find frame index.
        var ratios = curve.ratios;
        var currRatioDif, lastRatioDif;
        var canOptimize = true;
        var EPSILON = 1e-6;
        for (let i = 1, l = ratios.length; i < l; i++) {
            currRatioDif = ratios[i] - ratios[i-1];
            if (i === 1) {
                lastRatioDif = currRatioDif;
            }
            else if (Math.abs(currRatioDif - lastRatioDif) > EPSILON) {
                canOptimize = false;                
                break;
            }
        }

        curve._findFrameIndex = canOptimize ? quickFindIndex : binarySearch;

        return curve;
    }

    function createTargetCurves (target, curveData) {
        var propsData = curveData.props;
        var compsData = curveData.comps;

        if (propsData) {
            for (var propPath in propsData) {
                var data = propsData[propPath];
                var curve = createPropCurve(target, propPath, data);

                curves.push(curve);
            }
        }

        if (compsData) {
            for (var compName in compsData) {
                var comp = target.getComponent(compName);

                if (!comp) {
                    continue;
                }

                var compData = compsData[compName];
                for (var propPath in compData) {
                    var data = compData[propPath];
                    var curve = createPropCurve(comp, propPath, data);

                    curves.push(curve);
                }
            }
        }
    }

    // property curves

    var curveData = clip.curveData;
    var childrenCurveDatas = curveData.paths;

    createTargetCurves(root, curveData);

    for (var namePath in childrenCurveDatas) {
        var target = cc.find(namePath, root);

        if (!target) {
            continue;
        }

        var childCurveDatas = childrenCurveDatas[namePath];
        createTargetCurves(target, childCurveDatas);
    }

    // events curve

    var events = clip.events;

    if (!CC_EDITOR && events) {
        var curve;

        for (let i = 0, l = events.length; i < l; i++) {
            if (!curve) {
                curve = new EventAnimCurve();
                curve.target = root;
                curves.push(curve);
            }

            var eventData = events[i];
            var ratio = eventData.frame / state.duration;

            var eventInfo;
            var index = binarySearch(curve.ratios, ratio);
            if (index >= 0) {
                eventInfo = curve.events[index];
            }
            else {
                eventInfo = new EventInfo();
                curve.ratios.push(ratio);
                curve.events.push(eventInfo);
            }

            eventInfo.add(eventData.func, eventData.params);
        }
    }
}

if (CC_TEST) {
    cc._Test.initClipData = initClipData;
}


module.exports = AnimationAnimator;
