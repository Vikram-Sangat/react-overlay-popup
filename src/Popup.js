
var React = require('react');
var invar = require('invariant');
var Overlay = require('./Overlay');

var _strategies = { };

function calculate (vp, lp, lc, kp, kc, Δv) {

  return vp + kp * lp - kc * lc + Δv;
}

function calculateWithFallback (vp, lp, lc, kp, kc, vm, Δv) {

  var primary = kp !== kc;
  var vc = calculate(vp, lp, lc, kp, kc, Δv);

  if (primary) {
    if ((kp > 0.5 && vc + lc > vm) || (kp < 0.5 && vc < 0)) {
      return calculate(vp, lp, lc, 1 - kp, 1 - kc, -Δv);
    } else {
      return vc;
    }
  } else {
    if (vc < 0) {
      return calculate(vp, lp, lc, 0, 0, Δv);
    } else if (vc + lc > vm) {
      return calculate(vp, lp, lc, 1, 1, Δv);
    } else {
      return vc;
    }
  }
}

function createStrategy (parentX, childX, parentY, childY, gapX, gapY) {

  return function (parent, child, options) {

    var rect        = parent.getBoundingClientRect();
    var childWidth  = child.offsetWidth;
    var childHeight = child.offsetHeight;

    var left = calculateWithFallback(rect.left, rect.width,  childWidth,  parentX, childX, window.innerWidth,  gapX * options.gap);
    var top  = calculateWithFallback(rect.top,  rect.height, childHeight, parentY, childY, window.innerHeight, gapY * options.gap);

    child.style.visibility = 'visible';
    child.style.left = left + 'px';
    child.style.top  = top + 'px';
  };
}

_strategies['top left']       = createStrategy(0,   0,   0,   1,    0,  -1);
_strategies['top']            =
_strategies['top center']     = createStrategy(0.5, 0.5, 0,   1,    0,  -1);
_strategies['top right']      = createStrategy(1,   1,   0,   1,    0,  -1);

_strategies['bottom left']    = createStrategy(0,   0,   1,   0,    0,  1);
_strategies['bottom']         =
_strategies['bottom center']  = createStrategy(0.5, 0.5, 1,   0,    0,  1);
_strategies['bottom right']   = createStrategy(1,   1,   1,   0,    0,  1);

_strategies['left top']       = createStrategy(0,   1,   0,   0,   -1,  0);
_strategies['left']           =
_strategies['left center']    = createStrategy(0,   1,   0.5, 0.5, -1,  0);
_strategies['left bottom']    = createStrategy(0,   1,   1,   1,   -1,  0);

_strategies['right top']      = createStrategy(1,   0,   0,   0,    1,  0);
_strategies['right']          =
_strategies['right center']   = createStrategy(1,   0,   0.5, 0.5,  1,  0);
_strategies['right bottom']   = createStrategy(1,   0,   1,   1,    1,  0);

var Popup = React.createClass({

  propTypes: {
    strategy: React.PropTypes.string.isRequired,
    children: React.PropTypes.node,
    gap:      React.PropTypes.number,
  },

  componentDidMount: function () {

    this.reposition();
    window.addEventListener('resize', this.reposition, true);
  },

  componentDidUpdate: function () {

    this.reposition();
  },

  componentWillUnmount: function () {

    window.removeEventListener('resize', this.reposition, true);
  },

  reposition: function () {

    var parent = React.findDOMNode(this).parentNode;
    var child = React.findDOMNode(this.refs.popup);

    if (parent && child) {

      var strategy;

      if (typeof this.props.strategy === 'string') {
        invar(
          _strategies.hasOwnProperty(this.props.strategy),
          'The strategy %s must exist.',
          this.props.strategy
        );
        strategy = _strategies[this.props.strategy];
      }

      invar(typeof strategy === 'function', 'Strategy must be a function.');
      strategy(parent, child, { gap: this.props.gap || 0 });
    }
  },

  render: function () {

    return (
      <Overlay>
        <div className={Popup.POPUP_CLASS_NAME}
         ref='popup'
         style={{ visibility: 'hidden', position: 'fixed' }}>
          {this.props.children}
        </div>
      </Overlay>
    );
  },

});

Popup.POPUP_CLASS_NAME = 'tw-popup';

module.exports = Popup;