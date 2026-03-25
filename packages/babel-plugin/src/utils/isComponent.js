const t = require('@babel/types');

function hasJSX(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
  for (const key in node) {
    if (key === 'loc' || key === 'comments' || key === 'leadingComments' || key === 'trailingComments' || key === 'tokens' || key === 'extra') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (hasJSX(item)) return true;
      }
    } else if (child && typeof child === 'object') {
      if (hasJSX(child)) return true;
    }
  }
  return false;
}

function isComponent(node, name) {

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

  // Must contain JSX
  if (!hasJSX(actualFunction.body)) return false;

  return { isComponent: true, functionNode: actualFunction, isMemo };
}

module.exports = { isComponent };

