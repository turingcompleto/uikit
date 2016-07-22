import $ from 'jquery';
import {isString, isWithin, removeClass, getDimensions, toJQuery} from '../util/index';
import {Class, Mouse, Position, Toggable} from '../mixin/index';

export default function (UIkit) {

    var active;

    $(document).on('click', e => {
        if (active && !isWithin(e.target, active.$el) && (!active.toggle || !isWithin(e.target, active.toggle.$el))) {
            active.hide(false);
        }
    });

    UIkit.component('drop', {

        mixins: [Class, Mouse, Position, Toggable],

        props: {
            mode: String,
            toggle: Boolean,
            boundary: 'jQuery',
            boundaryAlign: Boolean,
            delayShow: Number,
            delayHide: Number,
            clsDrop: String
        },

        defaults: {
            mode: 'hover',
            toggle: true,
            boundary: window,
            boundaryAlign: false,
            delayShow: 0,
            delayHide: 800,
            clsDrop: false,
            hoverIdle: 200,
            animation: 'uk-animation-fade',
            cls: 'uk-open'
        },

        ready() {

            this.clsDrop = this.clsDrop || 'uk-' + this.$options.name;
            this.clsPos = this.clsDrop;

            this.updateAria(this.$el);

            this.$el.on('click', `.${this.clsDrop}-close`, e => {
                e.preventDefault();
                this.hide(false)
            });

            if (this.toggle) {
                this.toggle = isString(this.toggle) ? toJQuery(this.toggle) : this.$el.prev();

                if (this.toggle) {
                    this.toggle = UIkit.toggle(this.toggle, {target: this.$el, mode: this.mode})[0];
                }
            }

        },

        update: {

            handler() {

                if (!this.$el.hasClass(this.cls)) {
                    return;
                }

                removeClass(this.$el, this.clsDrop + '-(stack|boundary)').css({top: '', left: '', width: '', height: ''});

                this.$el.toggleClass(`${this.clsDrop}-boundary`, this.boundaryAlign);

                this.dir = this.pos[0];
                this.align = this.pos[1];

                var boundary = getDimensions(this.boundary), alignTo = this.boundaryAlign ? boundary : getDimensions(this.toggle.$el);

                if (this.align === 'justify') {
                    var prop = this.getAxis() === 'y' ? 'width' : 'height';
                    this.$el.css(prop, alignTo[prop]);
                } else if (this.$el.outerWidth() > Math.max(boundary.right - alignTo.left, alignTo.right - boundary.left)) {
                    this.$el.addClass(this.clsDrop + '-stack');
                    this.$el.trigger('stack', [this]);
                }

                this.positionAt(this.$el, this.boundaryAlign ? this.boundary : this.toggle.$el, this.boundary);

            },

            events: ['resize', 'orientationchange']

        },

        events: {

            beforeshow() {
                this.initMouseTracker();
                this.toggle.$el.addClass(this.cls).attr('aria-expanded', 'true');
            },

            beforehide() {
                this.cancelMouseTracker();
                this.toggle.$el.removeClass(this.cls).attr('aria-expanded', 'false').blur().find('a, button').blur();
            },

            toggle(e, toggle) {
                e.preventDefault();

                if (this.isToggled(this.$el)) {
                    this.hide(false);
                } else {
                    this.show(toggle, false);
                }
            },

            'toggleShow mouseenter'(e, toggle) {
                e.preventDefault();
                this.show(toggle);
            },

            'toggleHide mouseleave'(e) {
                e.preventDefault();

                if (this.toggle && this.toggle.mode === 'hover') {
                    this.hide();
                }
            }

        },

        methods: {

            show(toggle, delay = true) {

                if (toggle && this.toggle && !this.toggle.$el.is(toggle.$el)) {
                    this.hide(false);
                }

                this.toggle = toggle || this.toggle;

                this.clearTimers();

                if (this.isActive()) {
                    return;
                } else if (delay && active && active !== this && active.isDelaying) {
                    this.showTimer = setTimeout(this.show, 75);
                    return;
                } else if (active) {
                    active.hide(false);
                }

                var show = () => this.toggleElement(this.$el, true);

                if (delay && this.delayShow) {
                    this.showTimer = setTimeout(show, this.delayShow);
                } else {
                    show();
                }

                active = this;
            },

            hide(delay = true) {

                this.clearTimers();

                var hide = () => {
                    active = this.isActive() ? null : active;
                    this.toggleNow(this.$el, false);
                };

                this.isDelaying = this.movesTo(this.$el);

                if (delay && this.isDelaying) {
                    this.hideTimer = setTimeout(this.hide, this.hoverIdle);
                } else if (delay && this.delayHide) {
                    this.hideTimer = setTimeout(hide, this.delayHide);
                } else {
                    hide();
                }
            },

            clearTimers() {
                clearTimeout(this.showTimer);
                clearTimeout(this.hideTimer);
            },

            isActive() {
                return active === this;
            }

        }

    });

    UIkit.drop.getActive = () => active;
}
