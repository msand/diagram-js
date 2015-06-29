'use strict';

var assign = require('lodash/object/assign');


/**
 * A handler that implements reversible addition of shapes.
 *
 * @param {canvas} Canvas
 */
function CreateShapeHandler(canvas) {
  this._canvas = canvas;
}

CreateShapeHandler.$inject = [ 'canvas' ];

module.exports = CreateShapeHandler;



////// api /////////////////////////////////////////


/**
 * Appends a shape to a target shape
 *
 * @param {Object} context
 * @param {djs.model.Base} context.parent the parent object
 * @param {Point} context.position position of the new element
 */
CreateShapeHandler.prototype.execute = function(context) {

  var parent = this.getParent(context);

  var shape = context.shape;

  this.setPosition(shape, context);

  this.addElement(shape, parent, context);

  this.setAttachment(context);

  return shape;
};


/**
 * Undo append by removing the shape
 */
CreateShapeHandler.prototype.revert = function(context) {
  this._canvas.removeShape(context.shape);

  this.removeAttachment(context);
};


////// helpers /////////////////////////////////////////

CreateShapeHandler.prototype.setAttachment = function(context) {
  var shape = context.shape,
      host = context.host;

  if (!host) {
    return;
  }

  shape.host = host;

  if (!host.attachers) {
    host.attachers = [ shape ];
  } else {
    host.attachers.push(shape);
  }
};


CreateShapeHandler.prototype.removeAttachment = function(context) {
  var shape = context.shape,
      host = context.host,
      idx;

  if (!host) {
    return;
  }

  idx = host.attachers.indexOf(shape);

  // remove attacher
  host.attachers.splice(idx, 1);

  // remove host reference
  shape.host = null;
};

CreateShapeHandler.prototype.getParent = function(context) {
  var parent = context.parent;

  if (!parent) {
    throw new Error('parent required');
  }

  return parent;
};

CreateShapeHandler.prototype.getPosition = function(context) {
  if (!context.position) {
    throw new Error('no position given');
  }

  return context.position;
};

CreateShapeHandler.prototype.addElement = function(shape, parent) {
  this._canvas.addShape(shape, parent);
};

CreateShapeHandler.prototype.setPosition = function(shape, context) {
  var position = this.getPosition(context);

  // update to center position
  // specified in create context
  assign(shape, {
    x: position.x - shape.width / 2,
    y: position.y - shape.height / 2
  });
};
