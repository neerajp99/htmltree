"use strict";

var vars = {
    version: 0,
    depth: 13,
    size: 150,
    borderSize: 1,
    delayed: true,
    time: 500,
    fromColor: "#6E6E4A",
    toColor: "#189672"
};

var shrinkFactor = Math.sqrt(2) * 0.5;
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// bind the UI to the variables
function setting(name, prop) {
    var el = document.getElementById(name);
    var set = prop == "checked" ? prop : "value"; // IE: cannot set valueAsNumber...
    el[set] = vars[name];
    var onChange = function onChange() {
        var v = el[prop];
        if (isNaN(v)) v = el.value; // IE: returns NaN for valueAsNumber...
        if (vars[name] == v) return;
        vars[name] = v;

        vars.version++;
        start(name);
    };
    el.addEventListener("change", onChange, false);
    el.addEventListener("input", onChange, false);
}
setting("depth", "valueAsNumber");
setting("size", "valueAsNumber");
setting("borderSize", "valueAsNumber");
setting("delayed", "checked");
setting("time", "valueAsNumber");
setting("fromColor", "value");
setting("toColor", "value");


var points = [];

function calculate(depth, x, y, size, angle) {
    // calc all points needed to draw the rect
    var p1 = point(x, y, size, nextAngle(angle, 270)); // ^
    var p2 = point(p1.x, p1.y, size, nextAngle(angle, 0)); // >
    var p3 = point(p2.x, p2.y, size, nextAngle(angle, 90)); // v
    var p4 = point(p3.x, p3.y, size, nextAngle(angle, 180)); // <

    if (!points[depth]) {
        points[depth] = [];
    }
    points[depth].push([p1, p2, p3, p4]);


    depth++;
    if (depth < vars.depth) {
        // left
        var newSize = size * shrinkFactor;
        calculate(depth, p1.x, p1.y, newSize, nextAngle(angle, -45));

        // right
        var right = point(p2.x, p2.y, newSize, nextAngle(angle, 225));
        calculate(depth, right.x, right.y, newSize, nextAngle(angle, 45));
    }
}

// draw the previously calculates points
function draw(version, depth) {
    if (version != vars.version) return;

    var drawRect = function drawRect(point) {
        if (version != vars.version) return;

        var c = colors[depth];
        var p1 = point[0];
        var p2 = point[1];
        var p3 = point[2];
        var p4 = point[3];

        // draw the body
        ctx.fillStyle = "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.fill();

        // draw the border
        if (vars.borderSize) {
            ctx.strokeStyle = "rgb(0,0,0)";
            ctx.lineCap = "square";
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        }
    };

    // draw each rect async to get the delayed effect
    var fns = points[depth].map(function(point) {
        return function(cb) {
            var fn = function fn() {
                drawRect(point);
                cb();
            };
            if (vars.delayed) setTimeout(fn, rnd(16, vars.time));
            else fn();
        };
    });
    complete(fns, function() {
        depth++;
        if (depth < vars.depth) {
            draw(version, depth);
        }
    });
}

// color management
var colors = [];

function hexToRGB(hexStr) {
    var hex = parseInt(hexStr.substring(1), 16);
    var r = hex >> 16;
    var g = hex >> 8 & 0xFF;
    var b = hex & 0xFF;
    return [r, g, b];
}

function updateColors() {
    var depth = vars.depth;
    var from = hexToRGB(vars.fromColor);
    var to = hexToRGB(vars.toColor);
    var changePerDepth = [(from[0] - to[0]) / (depth - 1), (from[1] - to[1]) / (depth - 1), (from[2] - to[2]) / (depth - 1)];

    colors = [];
    for (var i = 0; i < depth; i++) {
        colors.push([from[0] - changePerDepth[0] * i | 0, from[1] - changePerDepth[1] * i | 0, from[2] - changePerDepth[2] * i | 0]);
    }
}

//
// pythagoras related stuff
//

// pre-calculate all 360 cos/sin from degree to rad

var _ref = (function() {
    var c = {},
        s = {},
        pi = Math.PI;
    for (var i = 0; i < 360; i++) {
        c[i] = Math.cos(i * pi / 180);
        s[i] = Math.sin(i * pi / 180);
    }
    return {
        cosMap: c,
        sinMap: s
    };
})();

var cosMap = _ref.cosMap;
var sinMap = _ref.sinMap;

function nextAngle(a, deg) {
    var na = a + deg;
    if (na >= 360) return na - 360;
    if (na < 0) return 360 + na;
    return na;
}

function point(x1, y1, L, deg) {
    return {
        x: x1 + L * cosMap[deg],
        y: y1 + L * sinMap[deg]
    };
}

//
// other helpers
//

// complete waits for all async functions to finish
function complete(fns, cb) {
    var i = 0;

    function called() {
        i++;
        if (i == fns.length) cb();
    }
    fns.forEach(function(fn) {
        return fn(called);
    });
}
// rnd returns a random number between given min and max
function rnd(min, max) {
    return Math.floor(Math.random() * max) + min;
}

// main entry point
function start(action) {
    canvas.width = vars.size * 6;
    canvas.height = vars.size * 4;
    ctx.lineWidth = vars.borderSize;

    // update the colors if one of these vars changes
    if (["all", "depth", "fromColor", "toColor"].indexOf(action) != -1) {
        updateColors();
    }
    // calc the points if one of these vars changes
    if (["all", "depth", "size"].indexOf(action) != -1) {
        points = [];
        calculate(0, (canvas.width - vars.size) / 2, canvas.height, vars.size, 0);
    }

    draw(vars.version, 0);
}

// -> START!
start("all");
