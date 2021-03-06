module.exports = {
    "help_url": {
        "audiosource": "http://docs.cocos.com/creator/manual/zh/components/audiosource.html",
        "animation": "http://www.cocos.com/docs/creator/components/animation.html",
        "sprite": "http://www.cocos.com/docs/creator/components/sprite.html",
        "label": "http://www.cocos.com/docs/creator/components/label.html",
        "canvas": "http://www.cocos.com/docs/creator/components/canvas.html",
        "spine": "http://www.cocos.com/docs/creator/components/spine.html",
        "widget": "http://www.cocos.com/docs/creator/components/widget.html",
        "button": "http://www.cocos.com/docs/creator/components/button.html",
        "progressbar": "http://www.cocos.com/docs/creator/components/progress.html",
        "mask": "http://www.cocos.com/docs/creator/components/mask.html",
        "scrollview": "http://www.cocos.com/docs/creator/components/scrollview.html",
        "scrollbar": "http://www.cocos.com/docs/creator/components/scrollbar.html",
        "layout": "http://www.cocos.com/docs/creator/components/layout.html",
        "tiledmap": "http://www.cocos.com/docs/creator/components/tiledmap.html",
        "editbox": "http://www.cocos.com/docs/creator/components/editbox.html",
        "videoplayer": "http://www.cocos.com/docs/creator/components/videoplayer.html",
        "motionStreak": "http://www.cocos.com/docs/creator/components/motion-streak.html",
        "richtext": "http://www.cocos.com/docs/creator/components/richtext.html",
        "pageview": "http://www.cocos.com/docs/creator/components/pageview.html",
        "pageviewIndicator": "http://docs.cocos.com/creator/manual/zh/components/pageviewindicator.html",
        "toggle": "http://www.cocos.com/docs/creator/components/toggle.html",
        "toggleGroup": "http://www.cocos.com/docs/creator/components/toggleGroup.html",
        "toggleContainer": "http://www.cocos.com/docs/creator/components/toggleContainer.html",
        "slider": "http://www.cocos.com/docs/creator/components/slider.html",
        "block_input_events": "http://docs.cocos.com/creator/manual/zh/components/block-input-events.html",
        "wx_subcontext_view": "http://docs.cocos.com/creator/manual/zh/publish/publish-wechatgame-sub-domain.html"
    },
    'animation': {
        'default_clip': '?????????????????????????????? play() ???????????????????????? clip???',
        'clips': '???????????????????????????????????? AnimationClip ??????',
        'play_on_load': '???????????????????????????????????????????????? clip???'
    },
    'audio': {
        'clip': '?????????????????????????????? AudioClip ??????',
        'volume': '?????????????????????????????????????????????',
        'mute': '????????????????????????????????????????????????????????????????????????',
        'loop': '??????????????????',
        'play_on_load': '??????????????????????????????????????????'
    },
    'sprite': {
        'sprite_frame': '?????? Sprite ????????? SpriteFrame ????????????',
        'atlas': '????????????????????? Atlas ????????????',
        'type': '???????????????\n - ??????(Simple)?????????????????????????????????????????????????????????????????????????????? \n' +
        '- ????????????Sliced??????????????????????????????????????????????????????????????? UI ????????????????????? \n' +
        '- ?????????Tiled????????????????????????????????????????????????????????? \n' +
        '- ?????????Filled??????????????????????????????????????????????????????????????????????????????????????????',
        'original_size': '????????????????????????????????????????????? Sprite ????????? size',
        'edit_button': '??????',
        'select_button': '??????',
        'select_tooltip': '?????? Atlas ???????????? SpriteFrame',
        'edit_tooltip': '?????? Sprite ????????????????????????????????????',
        'fill_type': '????????????????????????????????????Horizontal???????????????Vertical???????????????Radial???????????????',
        'fill_center': '????????????????????????????????????????????????????????? 0 ~ 1',
        'fill_start': '????????????????????????????????? 0 ~ 1 ?????????????????????????????????????????????',
        'fill_range': '??????????????????????????? 0 ~ 1 ????????????????????????????????????',
        'src_blend_factor': '??????????????????????????????????????????????????????',
        'dst_blend_factor': '?????????????????????????????????????????????????????????',
        'size_mode': '?????? Sprite ????????????????????????CUSTOM ????????????????????????TRIMMED ??????????????????????????????????????????????????????RAW ???????????????????????????????????????',
        'trim': '?????????????????????????????????????????????????????????????????????????????????????????????????????????'
    },
    'button': {
        'click_event': {
            'target': '???????????????????????????',
            'component': '???????????????????????????',
            'handler': '???????????????????????????',
            "customEventData": "???????????????????????????????????????????????????????????????????????????????????????????????????????????????"
        },
        'interactable': '????????????????????????????????????????????????????????????????????????',
        'transition': '????????????????????????????????????',
        'normal_color': '?????????????????????????????????',
        'pressed_color': '?????????????????????????????????',
        'hover_color': '?????????????????????????????????',
        'disabled_color': '?????????????????????????????????',
        'duration': '???????????????????????????????????????????????????',
        'zoom_scale': '???????????????????????????????????????????????????????????????????????? Button ?????? scale * zoomScale, zoomScale ???????????????',
        'auto_gray_effect': "????????????????????? true?????? button ??? interactable ????????? false ??????????????????????????? shader ??? button ??? target ????????? sprite ????????????",
        'normal_sprite': '????????????????????????????????????',
        'pressed_sprite': '????????????????????????????????????',
        'hover_sprite': '????????????????????????????????????',
        'disabled_sprite': '????????????????????????????????????',
        'target': '?????? Button ???????????????Button ???????????????????????????????????? Color ??? Sprite ??????',
        'click_events': '????????????????????????????????????????????????1????????????????????????????????????????????????????????????????????????'
    },
    'canvas': {
        'design_resolution': '?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????? Canvas ??????????????????????????????',
        'fit_height': '???????????? Canvas ??????????????????????????????????????????????????????',
        'fit_width': '???????????? Canvas ??????????????????????????????????????????????????????'
    },
    'label': {
        'string': 'Label ??????????????????????????????',
        'horizontal_align': '????????????????????????',
        'vertical_align': '????????????????????????',
        'font_size': '?????????????????? point ?????????',
        'font_family': '??????????????????',
        'line_height': '?????????????????? point ?????????',
        'overflow': '??????????????????????????????????????????\n 1. CLAMP: ?????????????????????????????????????????? \n 2. SHRINK: ???????????????????????????????????????\n 3. RESIZE: ??????????????????????????????????????? height ??????.',
        'wrap': '????????????????????????',
        'font': 'Label ?????????????????????',
        'system_font': '??????????????????????????????????????????????????? file ????????????',
    },
    'progress': {
        'bar_sprite': '????????????????????? Sprite ?????????????????????????????????',
        'mode': '?????????????????????????????????????????????????????????',
        'total_length': '???????????? progress ??? 1 ??????????????????',
        'progress': '??????????????????????????????0???1',
        'reverse': '???????????????????????????'
    },
    'scrollbar': {
        'handle': '????????????????????????????????????????????? Sprite',
        'direction': 'ScrollBar???????????????',
        'auto_hide': '?????????????????????????????????????????? ScrollBar',
        'auto_hide_time': '????????????????????????????????????????????????',
    },
    'scrollview': {
        'content': '??????????????????????????????????????????',
        'horizontal': '????????????????????????',
        'vertical': '????????????????????????',
        'inertia': '????????????????????????',
        'brake': '???????????????????????????????????????????????????????????????0?????????????????????1??????????????????',
        'elastic': '??????????????????????????????????????????????????????????????????',
        'bounce_time': '?????????????????????',
        'horizontal_bar': '??????????????? ScrollBar',
        'vertical_bar': '??????????????? ScrollBar',
        "bounceDuration": '????????????????????????0 ?????????????????????',
        "scrollEvents": '?????????????????????????????????',
        "cancelInnerEvents": '????????????????????????????????????????????????????????????'
    },
    'pageview': {
        "sizeMode": "???????????????????????????????????????",
        "direction": '????????????????????????',
        "scrollThreshold": '???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
        "pageTurningEventTiming": '?????? PageView ?????????????????????????????????????????????????????????????????? PageView ????????????????????????',
        "indicator": '???????????????????????????',
        "pageTurningSpeed": '????????????????????????????????????????????????',
        'pageEvents': '?????????????????????????????????',
        "autoPageTurningThreshold": "?????????????????????????????? ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????",
    },
    'pageview_indicator': {
        'spriteFrame': '?????????????????????????????????',
        'direction': '????????????????????????',
        'cell_size': '?????????????????????',
        'spacing': '???????????????????????????'
    },
    'toggle': {
        'interactable': 'Toggle ??????????????????????????????????????????Toggle ??????????????????',
        'transition': 'Toggle ??????????????????????????????',
        'normal_color': '??????????????? Toggle ????????????',
        'resize_node': '??? Toggle ??? node ?????????????????? Target ??? node ?????????',
        'pressed_color': '??????????????? Toggle ????????????',
        'hover_color': '??????????????? Toggle ????????????',
        'disabled_color': '??????????????? Toggle ????????????',
        'duration': 'Toggle ?????????????????????????????????????????????',
        'zoom_scale': '??????????????? Toggle ??????Toggle ??????????????????????????????????????? Toggle ?????? scale * zoomScale, zoomScale ???????????????',
        'auto_gray_effect': "????????????????????? true?????? toggle ??? interactable ????????? false ??????????????????????????? shader ??? toggle ??? target ????????? sprite ????????????",
        'normal_sprite': '??????????????? Toggle ???????????????',
        'pressed_sprite': '??????????????? Toggle ???????????????',
        'hover_sprite': '??????????????? Toggle ???????????????',
        'disabled_sprite': '??????????????? Toggle ???????????????',
        'target': '?????? Toggle ???????????????Toggle ???????????????????????????????????? Color ??? Sprite ??????',
        'isChecked': '????????????????????? true?????? check mark ??????????????? enabled ????????????????????? disabled ?????????',
        'checkMark': 'Toggle ??????????????????????????????????????????',
        'toggleGroup': 'Toggle ????????? ToggleGroup??????????????????????????????????????????????????? null?????? Toggle ????????? CheckBox????????????Toggle ????????? RadioButton???'
    },
    'toggle_group': {
        'allowSwitchOff': "????????????????????? true??? ?????? toggle ??????????????????????????????????????????????????????????????????"
    },
    'slider': {
        'handle': '??????????????????',
        'direction': '????????????',
        'progress': '??????????????????????????????????????? 0-1 ?????????',
        'slideEvents': '?????????????????????????????????'
    },
    'widget': {
        'target': '????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
        'align_top': '???????????????????????????',
        'align_bottom': '???????????????????????????',
        'align_left': '???????????????????????????',
        'align_right': '???????????????????????????',
        'align_h_center': '????????????????????????????????????????????????????????????????????????????????????????????????',
        'align_v_center': '????????????????????????????????????????????????????????????????????????????????????????????????',
        "align_mode": "?????? Widget ??????????????????????????????????????? Widget ?????????????????????",
        'top': '???????????????????????????????????????????????????????????????????????????????????????px???????????????????????????????????????????????? height ?????????????????????????????????',
        'bottom': '???????????????????????????????????????????????????????????????????????????????????????px???????????????????????????????????????????????? height ?????????????????????????????????',
        'left': '???????????????????????????????????????????????????????????????????????????????????????px???????????????????????????????????????????????? width ?????????????????????????????????',
        'right': '???????????????????????????????????????????????????????????????????????????????????????px???????????????????????????????????????????????? width ?????????????????????????????????',
        'horizontal_center': '?????????????????????????????????????????????????????????????????????px???????????????????????????',
        'vertical_center': '?????????????????????????????????????????????????????????????????????px???????????????????????????'
    },
    'layout': {
        'layout_type': '??????????????????????????????\n 1. NONE??????????????????????????????????????? \n 2. HORIZONTAL?????????????????????????????? \n 3. VERTICAL??????????????????????????????\n 4. GRID, ????????????????????????????????????????????????',
        'resize_mode': '????????????????????????\n 1. NONE???????????????????????????????????????????????? \n 2. CHILD, ????????????????????????????????? \n 3. CONTAINER, ??????????????????????????????',
        'padding_left': 'Layout ???????????????????????????????????????',
        'padding_right': 'Layout ???????????????????????????????????????',
        'padding_top': 'Layout ???????????????????????????????????????',
        'padding_bottom': 'Layout ???????????????????????????????????????',
        'space_x': '????????????????????????????????????',
        'space_y': '????????????????????????????????????',
        'vertical_direction': '??????????????????????????????????????????\n 1. TOP_TO_BOTTOM, ?????????????????? \n 2. BOTTOM_TO_TOP, ??????????????????',
        'horizontal_direction': '??????????????????????????????????????????\n 1. LEFT_TO_RIGHT, ?????????????????? \n 2. RIGHT_TO_LEFT, ??????????????????',
        'cell_size': '????????????????????????????????????????????????',
        'start_axis': '?????????????????????????????????????????????????????????????????????????????????????????????',
    },
    'particle': {
        'export_title': "???????????????????????????????????? plist ??????",
        'export': "??????",
        'export_error': "????????????????????????????????????",
        'sync': "??????",
        'sync_tips': "?????? File ??????????????? Custom"
    },
    'editbox': {
        "string": "???????????????????????????????????????????????????????????????????????????",
        "backgroundImage": "????????????????????????",
        "input_flag": "?????????????????????????????????????????????????????????????????????????????????",
        "returnType": "?????????????????????????????????????????????",
        "input_mode": "??????????????????: ANY?????????????????????????????????????????????????????????????????????????????????????????????",
        "font_size": "??????????????????????????????",
        "line_height": "????????????????????????",
        "font_color": "????????????????????????",
        "stay_on_top": "????????? True ???????????????????????????????????????????????????????????????",
        "tab_index": "?????? DOM ??????????????? tabIndex???????????????????????? Web ????????????????????????",
        "placeholder": "?????????????????????????????????",
        "placeholder_font_size": "?????????????????????????????????",
        "placeholder_font_color": "?????????????????????????????????",
        "max_length": "??????????????????????????????????????????",
    },
    "videoplayer": {
        "resourceType": "????????????????????????????????? URL ??????????????? URL",
        "url": "??????????????? URL",
        "video": "??????????????? URL",
        "volume": "??????????????????0.0 ~ 1.0???",
        "mute": "????????????????????????????????????????????? 0???????????????????????????????????????",
        "currentTime": "????????????????????????????????????",
        "keepAspectRatio": "????????????????????????????????????",
        "isFullscreen": "????????????????????????",
    },
    "webview": {
        "url": "???????????? URL ???????????????????????? http ?????? https ????????????????????????????????? URL ?????????"
    },
    "richtext": {
        "string": "???????????????????????????, ???????????????????????? BBCode ??????????????????????????????",
        "horizontal_align": "??????????????????",
        "font_size": "????????????, ????????? point",
        "font": "?????????????????????",
        "line_height": "????????????, ????????? point",
        "max_width": "????????????????????????, ??? 0 ?????????????????????????????????.",
        "image_atlas": "?????? img ??????????????? src ??????????????????????????? imageAtlas ??????????????????????????? spriteFrame????????? img tag ?????????????????????",
        "handleTouchEvent": "?????????????????????RichText ????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????"
    },
    'skeleton': {
        "skeleton_data": "??????????????????????????? Spine ??????????????????????????? json ??????????????????????????????",
        "default_skin": "?????????????????????",
        "animation": "???????????????????????????",
        "loop": "??????????????????????????????",
        "time_scale": "?????????????????????????????????????????????",
        "debug_slots": "???????????? slot ??? debug ??????",
        "debug_bones": "???????????? bone ??? debug ??????",
        "premultipliedAlpha": "????????????????????????",
    },
    "dragon_bones": {
        "dragon_bones_asset": "??????????????????????????? DragonBones ??????????????????????????? json ??????????????????????????????",
        "dragon_bones_atlas_asset": "Texture ????????????????????? DragonBones ????????? Texture ?????? json ??????????????????????????????",
        "armature_name": "????????? Armature ??????",
        "animation_name": "???????????????????????????",
        "time_scale": "?????????????????????????????????????????????",
        "play_times": "?????????????????????????????????\n-1 ???????????????????????????????????????\n0 ??????????????????\n>0 ??????????????????",
        "debug_bones": "???????????? bone ??? debug ??????"
    },
    'motionStreak': {
        'fadeTime': "?????????????????????,???????????????",
        'minSeg': "????????????????????????",
        'stroke': "???????????????",
        'texture': "???????????????",
        'color': "???????????????",
        'fastMode': "???????????????????????????"
    },
    "missing_scirpt": {
        "error_compiled": '???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
        "error_not_compiled": '???????????????????????????????????????????????????????????????????????????????????????????????????'
    },
    'collider': {
        'editing': '?????????????????????????????????',
        'category': '????????????????????????',
        'mask': '?????????????????????????????????????????????'
    },
    'particle_system': {
        'preview': '????????????????????????????????????????????????????????????????????????????????????',
        'custom': '???????????????????????????',
        'file': 'plist ???????????????????????????',
        'spriteFrame': '??????????????????',
        'texture': '??????????????????????????????????????? spriteFrame ?????????????????????',
        'particleCount': '???????????????????????????',
        'srcBlendFactor': '????????????????????????',
        'dstBlendFactor': '???????????????????????????',
        'playOnLoad': '??????????????? true ??????????????????????????????',
        'autoRemoveOnFinish': '????????????????????????????????????????????????',
        'duration': '????????????????????????????????????-1??????????????????',
        'emissionRate': '???????????????????????????',
        'life': '????????????????????????????????????',
        'totalParticles': '??????????????????',
        'startColor': '??????????????????',
        'startColorVar': '??????????????????????????????',
        'endColor': '??????????????????',
        'endColorVar': '??????????????????????????????',
        'angle': '???????????????????????????',
        'startSize': '????????????????????????????????????',
        'endSize': '???????????????????????????????????????',
        'startSpin': '???????????????????????????????????????',
        'endSpin': '???????????????????????????????????????',
        'sourcePos': '???????????????',
        'posVar': '??????????????????????????????????????????????????????',
        'positionType': '??????????????????',
        'emitterMode': '???????????????',
        'gravity': '??????',
        'speed': '?????????????????????',
        'tangentialAccel': '?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
        'radialAccel': '????????????????????????????????????????????????????????????????????????????????????????????????????????????',
        'rotationIsDir': '???????????????????????????????????????????????????????????????????????????',
        'startRadius': '????????????????????????????????????????????????????????????????????????????????????????????????????????????',
        'endRadius': '????????????????????????????????????????????????????????????',
        'rotatePerS': '??????????????????????????????????????????????????????????????????????????????????????????',
    },
    "mask": {
        'type': '????????????',
        'spriteFrame': '????????????????????????',
        'inverted': '???????????????????????? Canvas ?????????',
        'alphaThreshold': 'Alpha???????????????????????????????????? alpha ?????? alphaThreshold ???????????????????????????????????? Canvas ?????????',
        'segements': '??????????????????????????????'
    },
    'physics': {
        'rigidbody': {
            'enabledContactListener': '????????????????????????????????? collider ?????????????????????????????????????????????????????????????????????????????????',
            'bullet': '??????????????????????????????????????????????????????????????????????????????????????????????????????',
            'type': '??????????????? Static????????????, Kinematic??????????????????, Dynamic??????????????? Animated????????????????????????????????????????????????',
            'allowSleep': '??????????????????????????????????????????????????????????????????????????? false???????????????????????? CPU ???????????????',
            'gravityScale': '???????????????????????????????????????',
            'linearDamping': 'Linear damping ???????????????????????????????????????????????????????????? 1????????????????????????????????????????????????????????????????????????????????????',
            'angularDamping': 'Angular damping ????????????????????????????????????????????????????????? 1????????????????????????????????????????????????????????????????????????????????????',
            'linearVelocity': '???????????????????????????????????????',
            'angularVelocity': '??????????????????',
            'fixedRotation': '?????????????????????????????????',
            'awake': '???????????????????????????'
        },
        'physics_collider': {
            'density': '??????',
            'sensor': '????????????????????????????????????????????????????????????????????????????????????????????????',
            'friction': '?????????????????????????????? [0, 1] ??????',
            'restitution': '?????????????????????????????? [0, 1]??????',
            'anchor': '??????????????????',
            'connectedAnchor': '?????????????????????????????????',
            'connectedBody': '??????????????????????????????',
            'collideConnected': '????????????????????????????????????????????????????????????',
            'distance': '?????????????????????',
            'frequency': '???????????????',
            'dampingRatio': '????????????????????????????????????????????????????????????????????????',
            'linearOffset': '??????????????????????????????????????????????????????????????????',
            'angularOffset': '??????????????????????????????????????????????????????????????????',
            'maxForce': '???????????????????????????????????????',
            'maxTorque': '???????????????????????????????????????',
            'correctionFactor': '?????????????????????????????? [0, 1]',
            'mouseRegion': '?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
            'target': '????????????????????????????????????????????????????????????????????????',
            'localAxisA': '????????????????????????????????????',
            'enableLimit': '????????????????????????????????????',
            'enableMotor': '???????????????????????????',
            'lowerLimit': '??????????????????????????????',
            'upperLimit': '??????????????????????????????',
            'maxMotorForce': '????????????????????????????????????',
            'motorSpeed': '????????????????????????',
            'referenceAngle': '?????????????????????????????????????????????????????????????????????????????????',
            'lowerAngle': '????????????????????????',
            'upperAngle': '????????????????????????',
            'maxMotorTorque': '???????????????????????????????????????',
            'maxLength': '???????????????',
            'offset': '???????????????',
            'size': '???????????????',
            'radius': '????????????',
            'tag': '?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????',
            'points': '?????????????????????'
        }
    },
    'block_input_events': {
        'brief_help': '????????????????????????????????????????????????????????????????????????????????????????????? UI ????????????'
    },
    'tiledtile': {
        'row': '?????? TiledTile ???????????????????????????????????????',
        'column': '?????? TiledTile ???????????????????????????????????????',
        'gid': '?????? TiledTile ??? gid ???',
        'layer': '?????? TiledTile ??????????????? TiledLayer'
    }
};