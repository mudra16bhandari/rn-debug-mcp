const t = require('@babel/types');

function isComponent(node, name) {
  // Must have a name starting with uppercase
  if (!name || !/^[A-Z]/.test(name)) return false;

  let actualFunction = node;
  let isMemo = false;

  // Handle React.memo(Component) and React.forwardRef(Component)
  if (t.isCallExpression(node)) {
    const callee = node.callee;
    const isMemoCall =
      (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'React' }) &&
        t.isIdentifier(callee.property, { name: 'memo' })) ||
      t.isIdentifier(callee, { name: 'memo' });

    const isForwardRefCall =
      (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'React' }) &&
        t.isIdentifier(callee.property, { name: 'forwardRef' })) ||
      t.isIdentifier(callee, { name: 'forwardRef' });

    if ((isMemoCall || isForwardRefCall) && node.arguments.length > 0) {
      actualFunction = node.arguments[0];
      if (isMemoCall) isMemo = true;
    }
  }

  // Must be a function
  if (
    !t.isFunctionDeclaration(actualFunction) &&
    !t.isFunctionExpression(actualFunction) &&
    !t.isArrowFunctionExpression(actualFunction)
  )
    return false;

  // Skip if it has no body (expression arrow with no JSX check possible)
  if (!actualFunction.body) return false;

  return { isComponent: true, functionNode: actualFunction, isMemo };
}

module.exports = { isComponent };
