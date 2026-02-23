const { declare } = require('@babel/helper-plugin-utils');
const t = require('@babel/types');
const { isComponent } = require('./utils/isComponent');

module.exports = declare((api) => {
  api.assertVersion(7);

  return {
    name: 'rn-debug-mcp',
    visitor: {
      Program: {
        enter(path, state) {
          state.needsImport = false;
          const filename = state.file.opts.filename;
          state.skip = filename && (filename.includes('node_modules') || filename.includes('instrumentation/src'));
        },
        exit(path, state) {
          if (state.skip) return;
          if (state.needsImport) {
            const hasBinding = path.scope.hasBinding('useRenderTracker');

            if (!hasBinding) {
              const requireDecl = t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.objectPattern([
                    t.objectProperty(t.identifier('useRenderTracker'), t.identifier('useRenderTracker'), false, true),
                    t.objectProperty(t.identifier('useRenderCheck'), t.identifier('useRenderCheck'), false, true)
                  ]),
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral('@rn-debug-mcp/instrumentation')
                  ])
                )
              ]);
              path.unshiftContainer('body', requireDecl);
            }
          }
        }
      },
      FunctionDeclaration(path, state) {
        if (state.skip) return;
        const name = path.node.id?.name;
        const result = isComponent(path.node, name);
        if (!result) return;

        const propsParam = result.functionNode.params[0];
        if (injectTracker(path.get('body'), name, propsParam)) {
          state.needsImport = true;
        }
      },
      VariableDeclarator(path, state) {
        if (state.skip) return;
        const name = path.node.id?.name;
        const init = path.node.init;
        if (!init) return;

        const result = isComponent(init, name);
        if (!result) return;

        // For VariableDeclarator, the body might be in path.get('init.body') 
        // OR if it's a memo wrapper, it's deeper.
        let targetBodyPath;
        if (result.functionNode === init) {
          targetBodyPath = path.get('init.body');
        } else if (t.isCallExpression(init) && init.arguments[0] === result.functionNode) {
          targetBodyPath = path.get('init.arguments.0.body');
        }

        if (targetBodyPath && t.isBlockStatement(targetBodyPath.node)) {
          const propsParam = result.functionNode.params[0];
          if (injectTracker(targetBodyPath, name, propsParam)) {
            state.needsImport = true;
          }
        }
      },

    },
  };
});

function injectTracker(bodyPath, componentName, propsParam) {
  const first = bodyPath.node.body[0];
  if (
    first &&
    t.isExpressionStatement(first) &&
    t.isCallExpression(first.expression) &&
    t.isIdentifier(first.expression.callee) &&
    (first.expression.callee.name === 'useRenderTracker' || first.expression.callee.name === 'useRenderCheck')
  )
    return false;

  // 1. Frequency tracker
  const trackerCall = t.expressionStatement(
    t.callExpression(t.identifier('useRenderTracker'), [t.stringLiteral(componentName)])
  );

  // 2. Props check (for unnecessary renders)
  const propsName = propsParam
    ? (t.isIdentifier(propsParam) ? propsParam : (t.isObjectPattern(propsParam) ? t.identifier('arguments[0]') : null))
    : t.objectExpression([]); // Fallback to empty object for components without props

  if (propsName) {
    const checkCall = t.expressionStatement(
      t.callExpression(t.identifier('useRenderCheck'), [
        t.stringLiteral(componentName),
        t.isIdentifier(propsName) || t.isObjectExpression(propsName)
          ? propsName
          : t.memberExpression(t.identifier('arguments'), t.numericLiteral(0), true)
      ])
    );
    bodyPath.unshiftContainer('body', checkCall);
  }

  bodyPath.unshiftContainer('body', trackerCall);
  return true;
}
