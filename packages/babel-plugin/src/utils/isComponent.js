const t = require('@babel/types');

function isComponent(node, name) {
  // Must have a name starting with uppercase
  if (!name || !/^[A-Z]/.test(name)) return false;

  let actualFunction = node;

  // Handle React.memo(Component) and React.forwardRef(Component)
  if (t.isCallExpression(node)) {
    const callee = node.callee;
    const isReactWrapper =
      (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'React' }) &&
        (t.isIdentifier(callee.property, { name: 'memo' }) || t.isIdentifier(callee.property, { name: 'forwardRef' }))) ||
      (t.isIdentifier(callee, { name: 'memo' }) || t.isIdentifier(callee, { name: 'forwardRef' }));

    if (isReactWrapper && node.arguments.length > 0) {
      actualFunction = node.arguments[0];
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

  return { isComponent: true, functionNode: actualFunction };
}

module.exports = { isComponent };

