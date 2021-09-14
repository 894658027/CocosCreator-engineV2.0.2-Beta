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

const renderEngine = require('../render-engine');
const gfx = renderEngine.gfx;

// Stage types
var Stage = cc.Enum({
    // Stencil disabled
    DISABLED: 0,
    // Clear stencil buffer
    CLEAR: 1,
    // Entering a new level, should handle new stencil
    ENTER_LEVEL: 2,
    // In content
    ENABLED: 3,
    // Exiting a level, should restore old stencil or disable
    EXIT_LEVEL: 4,
});

function StencilManager () {
    // todo: 8 is least Stencil depth supported by webGL device, it could be adjusted to vendor implementation value
    this._maxLevel = 8;
    // Current mask
    this._maskStack = [];
    // Current stage of process, DISABLED, ENTER_LEVEL, ENABLED, EXIT_LEVEL
    this.stage = Stage.DISABLED;
}

StencilManager.prototype = {
    constructor: StencilManager,

    reset () {
        // reset stack and stage
        this._maskStack.length = 0;
        this.stage = Stage.DISABLED;
    },

    handleEffect (effect) {
        let technique = effect.getTechnique('transparent');
        let passes = technique.passes;
        if (this.stage === Stage.DISABLED) {
            this.stage = Stage.DISABLED;
            for (let i = 0; i < passes.length; ++i) {
                let pass = passes[i];
                if (pass._stencilTest) {
                    pass.disableStencilTest();
                }
            }
            return effect;
        }

        let mask, func, ref, stencilMask, writeMask, failOp,
            zFailOp = gfx.STENCIL_OP_KEEP,
            zPassOp = gfx.STENCIL_OP_KEEP;
        
        if (this.stage === Stage.ENABLED) {
            mask = this._maskStack[this._maskStack.length - 1];
            func = gfx.DS_FUNC_EQUAL;
            failOp = gfx.STENCIL_OP_KEEP;
            ref = this.getStencilRef();
            stencilMask = ref;
            writeMask = this.getWriteMask();
        }
        else {
            if (this.stage === Stage.CLEAR) {
                mask = this._maskStack[this._maskStack.length - 1];
                func = gfx.DS_FUNC_NEVER;
                failOp = mask.inverted ? gfx.STENCIL_OP_REPLACE : gfx.STENCIL_OP_ZERO;
                ref = this.getWriteMask();
                stencilMask = ref;
                writeMask = ref;
            }
            else if (this.stage === Stage.ENTER_LEVEL) {
                mask = this._maskStack[this._maskStack.length - 1];
                // Fill stencil mask
                func = gfx.DS_FUNC_NEVER;
                failOp = mask.inverted ? gfx.STENCIL_OP_ZERO : gfx.STENCIL_OP_REPLACE;
                ref = this.getWriteMask();
                stencilMask = ref;
                writeMask = ref;
                
                this.stage = Stage.ENABLED;
            }
        }
        
        for (let i = 0; i < passes.length; ++i) {
            let pass = passes[i];
            pass.setStencilFront(func, ref, stencilMask, failOp, zFailOp, zPassOp, writeMask);
            pass.setStencilBack(func, ref, stencilMask, failOp, zFailOp, zPassOp, writeMask);
        }
        return effect;
    },

    pushMask (mask) {
        if (this._maskStack.length + 1 > this._maxLevel) {
            cc.errorID(9000, this._maxLevel);
        }
        this._maskStack.push(mask);
    },

    clear () {
        this.stage = Stage.CLEAR;
    },

    enterLevel () {
        this.stage = Stage.ENTER_LEVEL;
    },

    exitMask () {
        if (this._maskStack.length === 0) {
            cc.errorID(9001);
        }
        this._maskStack.pop();
        if (this._maskStack.length === 0) {
            this.stage = Stage.DISABLED;
        }
        else {
            this.stage = Stage.ENABLED;
        }
    },
  
    getWriteMask () {
        return 0x01 << (this._maskStack.length - 1);
    },

    getExitWriteMask () {
        return 0x01 << this._maskStack.length;
    },
  
    getStencilRef () {
        let result = 0;
        for (let i = 0; i < this._maskStack.length; ++i) {
            result += (0x01 << i);
        }
        return result;
    },

    getInvertedRef () {
        let result = 0;
        for (let i = 0; i < this._maskStack.length - 1; ++i) {
            result += (0x01 << i);
        }
        return result;
    }
};

StencilManager.sharedManager = new StencilManager();
StencilManager.Stage = Stage;

module.exports = StencilManager;