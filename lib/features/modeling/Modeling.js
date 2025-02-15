'use strict';

var forEach = require('lodash/collection/forEach');

var model = require('../../model');


/**
 * The basic modeling entry point.
 *
 * @param {EventBus} eventBus
 * @param {ElementFactory} elementFactory
 * @param {CommandStack} commandStack
 */
function Modeling(eventBus, elementFactory, commandStack) {
  this._eventBus = eventBus;
  this._elementFactory = elementFactory;
  this._commandStack = commandStack;

  var self = this;

  eventBus.on('diagram.init', function() {
    // register modeling handlers
    self.registerHandlers(commandStack);
  });
}

Modeling.$inject = [ 'eventBus', 'elementFactory', 'commandStack' ];

module.exports = Modeling;


Modeling.prototype.getHandlers = function() {
  return {
    'shape.append': require('./cmd/AppendShapeHandler'),
    'shape.create': require('./cmd/CreateShapeHandler'),
    'shape.delete': require('./cmd/DeleteShapeHandler'),
    'shape.move': require('./cmd/MoveShapeHandler'),
    'shape.attach': require('./cmd/AttachShapeHandler'),
    'shapes.move': require('./cmd/MoveShapesHandler'),
    'shape.resize': require('./cmd/ResizeShapeHandler'),
    'shape.replace': require('./cmd/ReplaceShapeHandler'),

    'spaceTool': require('./cmd/SpaceToolHandler'),

    'label.create': require('./cmd/CreateLabelHandler'),

    'connection.create': require('./cmd/CreateConnectionHandler'),
    'connection.delete': require('./cmd/DeleteConnectionHandler'),
    'connection.move': require('./cmd/MoveConnectionHandler'),
    'connection.layout': require('./cmd/LayoutConnectionHandler'),

    'connection.updateWaypoints': require('./cmd/UpdateWaypointsHandler'),

    'connection.reconnectStart': require('./cmd/ReconnectConnectionHandler'),
    'connection.reconnectEnd': require('./cmd/ReconnectConnectionHandler'),

    'elements.delete': require('./cmd/DeleteElementsHandler'),
    'element.updateAnchors': require('./cmd/UpdateAnchorsHandler'),
  };
};

/**
 * Register handlers with the command stack
 *
 * @param {CommandStack} commandStack
 */
Modeling.prototype.registerHandlers = function(commandStack) {
  forEach(this.getHandlers(), function(handler, id) {
    commandStack.registerHandler(id, handler);
  });
};


///// modeling helpers /////////////////////////////////////////


Modeling.prototype.moveShape = function(shape, delta, newParent, hints) {
  var context = {
    shape: shape,
    delta:  delta,
    newParent: newParent,
    hints: hints || {}
  };

  this._commandStack.execute('shape.move', context);
};


Modeling.prototype.moveShapes = function(shapes, delta, newParent, hints, isAttachment) {
  if (delta.id) {
      newParent = delta;
      hints = newParent;
      isAttachment = hints;
      delta = undefined;
  }

  if (typeof hints === 'boolean') {
    isAttachment = hints;
    hints = {};
  }

  var context = {
    shapes: shapes,
    delta: delta || { x: 0, y: 0 },
    newParent: newParent,
    hints: hints || {},
    isAttachment: isAttachment
  };

  this._commandStack.execute('shapes.move', context);
};


Modeling.prototype.attachShape = function(shape, target, isAttachment) {
  var context = {
    shape: shape,
    host: target
  };

  // Detach the element from the host.
  if (!isAttachment) {
    context.host = null;
  }

  if (context.host && !context.host.attachers) {
    context.host.attachers = [];
  }

  this._commandStack.execute('shape.attach', context);
};

/**
 * Update the anchors on the element with the given delta movement
 * @param  {djs.model.Element} element
 * @param  {Point} delta
 */
Modeling.prototype.updateAnchors = function(element, delta) {
  var context = {
    element: element,
    delta: delta
  };

  this._commandStack.execute('element.updateAnchors', context);
};

Modeling.prototype.moveConnection = function(connection, delta, newParent, hints) {

  var context = {
    connection: connection,
    delta: delta,
    newParent: newParent,
    hints: hints || {}
  };

  this._commandStack.execute('connection.move', context);
};


Modeling.prototype.layoutConnection = function(connection, hints) {

  var context = {
    connection: connection,
    hints: hints || {}
  };

  this._commandStack.execute('connection.layout', context);
};


Modeling.prototype.createConnection = function(source, target, connection, parent) {

  connection = this._create('connection', connection);

  var context = {
    source: source,
    target: target,
    parent: parent,
    connection: connection
  };

  this._commandStack.execute('connection.create', context);

  return context.connection;
};

Modeling.prototype.createShape = function(shape, position, target, isAttachment) {

  shape = this._create('shape', shape);

  var context = {
    position: position,
    shape: shape,
    parent: target
  };

  if (isAttachment) {
    context.parent = target.parent;
    context.host = target;
  }

  this._commandStack.execute('shape.create', context);

  return context.shape;
};


Modeling.prototype.createLabel = function(labelTarget, position, label, parent) {

  label = this._create('label', label);

  var context = {
    labelTarget: labelTarget,
    position: position,
    parent: parent,
    shape: label
  };

  this._commandStack.execute('label.create', context);

  return context.shape;
};


Modeling.prototype.appendShape = function(source, shape, position, parent, connection, connectionParent) {

  shape = this._create('shape', shape);

  var context = {
    source: source,
    position: position,
    parent: parent,
    shape: shape,
    connection: connection,
    connectionParent: connectionParent
  };

  this._commandStack.execute('shape.append', context);

  return context.shape;
};


Modeling.prototype.removeElements = function(elements) {
  var context = {
    elements: elements
  };

  this._commandStack.execute('elements.delete', context);
};


Modeling.prototype.removeShape = function(shape) {
  var context = {
    shape: shape
  };

  this._commandStack.execute('shape.delete', context);
};


Modeling.prototype.removeConnection = function(connection) {
  var context = {
    connection: connection
  };

  this._commandStack.execute('connection.delete', context);
};

Modeling.prototype.replaceShape = function(oldShape, newShape, options) {
  var context = {
    oldShape: oldShape,
    newData: newShape,
    options: options
  };

  this._commandStack.execute('shape.replace', context);

  return context.newShape;
};

Modeling.prototype.resizeShape = function(shape, newBounds) {
  var context = {
    shape: shape,
    newBounds: newBounds
  };

  this._commandStack.execute('shape.resize', context);
};

Modeling.prototype.createSpace = function(movingShapes, resizingShapes, delta, direction) {
  var context = {
    movingShapes: movingShapes,
    resizingShapes: resizingShapes,
    delta: delta,
    direction: direction
  };

  this._commandStack.execute('spaceTool', context);
};

Modeling.prototype.updateWaypoints = function(connection, newWaypoints) {
  var context = {
    connection: connection,
    newWaypoints: newWaypoints
  };

  this._commandStack.execute('connection.updateWaypoints', context);
};

Modeling.prototype.reconnectStart = function(connection, newSource, dockingOrPoints) {
  var context = {
    connection: connection,
    newSource: newSource,
    dockingOrPoints: dockingOrPoints
  };

  this._commandStack.execute('connection.reconnectStart', context);
};

Modeling.prototype.reconnectEnd = function(connection, newTarget, dockingOrPoints) {
  var context = {
    connection: connection,
    newTarget: newTarget,
    dockingOrPoints: dockingOrPoints
  };

  this._commandStack.execute('connection.reconnectEnd', context);
};

Modeling.prototype.connect = function(source, target, attrs) {
  return this.createConnection(source, target, attrs || {}, source.parent);
};

Modeling.prototype._create = function(type, attrs) {
  if (attrs instanceof model.Base) {
    return attrs;
  } else {
    return this._elementFactory.create(type, attrs);
  }
};
