const { declare } = require('@babel/helper-plugin-utils');
const t = require('@babel/types');
const path = require('path');
const { isComponent } = require('./utils/isComponent');

module.exports = declare((api) => {
  api.assertVersion(7);

  return {
    name: 'rn-debug-mcp',
    visitor: {
      Program: {
        enter(programPath, state) {
          state.needsImport = false;
          state.needsSetScreen = false;
          const filename = state.file.opts.filename;
          state.skip = filename && (filename.includes('node_modules') || filename.includes('instrumentation/src'));
        },
        exit(programPath, state) {
          if (state.skip) return;
          if (state.needsImport) {
            const hasBinding = programPath.scope.hasBinding('useRenderTracker');

            if (!hasBinding) {
              const imports = [
                t.objectProperty(t.identifier('useRenderTracker'), t.identifier('useRenderTracker'), false, true),
                t.objectProperty(t.identifier('useRenderCheck'), t.identifier('useRenderCheck'), false, true),
                t.objectProperty(t.identifier('useRenderTimeTracker'), t.identifier('useRenderTimeTracker'), false, true),
                t.objectProperty(t.identifier('useContextTracker'), t.identifier('useContextTracker'), false, true),
              ];

              if (state.needsSetScreen) {
                imports.push(t.objectProperty(t.identifier('setCurrentScreen'), t.identifier('setCurrentScreen'), false, true));
              }

              const requireDecl = t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.objectPattern(imports),
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral('@rn-debug-mcp/instrumentation')
                  ])
                )
              ]);
              programPath.unshiftContainer('body', requireDecl);
            }
          }
        }
      },
      JSXOpeningElement(p, state) {
        if (state.skip) return;
        const nodeName = p.node.name;

        if (
          t.isJSXMemberExpression(nodeName) &&
          t.isJSXIdentifier(nodeName.property) &&
          nodeName.property.name === 'Provider'
        ) {
          const contextName = t.isJSXIdentifier(nodeName.object) ? nodeName.object.name : 'UnknownContext';
          const valueAttr = p.node.attributes.find(
            (attr) => t.isJSXAttribute(attr) && attr.name.name === 'value'
          );

          if (valueAttr && t.isJSXExpressionContainer(valueAttr.value)) {
            const valueExpr = valueAttr.value.expression;
            const parentFn = p.getFunctionParent();

            if (parentFn && t.isBlockStatement(parentFn.node.body)) {
              const bodyPath = parentFn.get('body');
              const filename = state.file.opts.filename;
              const screenName = filename ? path.basename(filename, path.extname(filename)) : null;
              if (injectContextTracker(bodyPath, contextName, valueExpr, screenName)) {
                state.needsImport = true;
              }
            }
          }
        }
      },
      FunctionDeclaration(p, state) {
        if (state.skip) return;
        const name = p.node.id?.name;
        const result = isComponent(p.node, name);
        if (!result) return;

        const filename = state.file.opts.filename;
        const screenName = filename ? path.basename(filename, path.extname(filename)) : null;
        const propsParam = result.functionNode.params[0];

        if (injectTracker(p.get('body'), name, propsParam, screenName, state, result.isMemo)) {
          state.needsImport = true;
        }
      },
      VariableDeclarator(p, state) {
        if (state.skip) return;
        const name = p.node.id?.name;
        const init = p.node.init;
        if (!init) return;

        const result = isComponent(init, name);
        if (!result) return;

        let targetBodyPath;
        if (result.functionNode === init) {
          targetBodyPath = p.get('init.body');
        } else if (t.isCallExpression(init) && init.arguments[0] === result.functionNode) {
          targetBodyPath = p.get('init.arguments.0.body');
        }

        if (targetBodyPath && t.isBlockStatement(targetBodyPath.node)) {
          const filename = state.file.opts.filename;
          const screenName = filename ? path.basename(filename, path.extname(filename)) : null;
          const propsParam = result.functionNode.params[0];

          if (injectTracker(targetBodyPath, name, propsParam, screenName, state, result.isMemo)) {
            state.needsImport = true;
          }
        }
      },
    },
  };
});

function injectTracker(bodyPath, componentName, propsParam, screenName, state, isMemo) {
  const first = bodyPath.node.body[0];
  if (
    first &&
    t.isExpressionStatement(first) &&
    t.isCallExpression(first.expression) &&
    t.isIdentifier(first.expression.callee) &&
    (first.expression.callee.name === 'useRenderTracker' || first.expression.callee.name === 'useRenderCheck' || first.expression.callee.name === 'setCurrentScreen' || first.expression.callee.name === 'useRenderTimeTracker')
  )
    return false;

  // Auto-set current screen if component name matches filename (case-insensitive)
  if (screenName && componentName && componentName.toLowerCase() === screenName.toLowerCase()) {
    const setScreenCall = t.expressionStatement(
      t.callExpression(t.identifier('setCurrentScreen'), [t.stringLiteral(screenName)])
    );
    bodyPath.unshiftContainer('body', setScreenCall);
    state.needsSetScreen = true;
  }

  const args = [t.stringLiteral(componentName)];
  if (screenName) {
    args.push(t.stringLiteral(screenName));
  }

  // 1. Frequency tracker
  const trackerArgs = [t.stringLiteral(componentName)];
  if (screenName) {
    trackerArgs.push(t.stringLiteral(screenName));
  }

  const trackerCall = t.expressionStatement(
    t.callExpression(t.identifier('useRenderTracker'), trackerArgs)
  );

  // 2. Props check (for unnecessary renders)
  const propsName = propsParam
    ? (t.isIdentifier(propsParam) ? propsParam : (t.isObjectPattern(propsParam) ? t.identifier('arguments[0]') : null))
    : t.objectExpression([]);

  if (propsName) {
    const checkArgs = [
      t.stringLiteral(componentName),
      t.isIdentifier(propsName) || t.isObjectExpression(propsName)
        ? propsName
        : t.memberExpression(t.identifier('arguments'), t.numericLiteral(0), true)
    ];
    if (screenName) {
      checkArgs.push(t.stringLiteral(screenName));
    }
    if (isMemo) {
      if (!screenName) checkArgs.push(t.identifier('undefined'));
      checkArgs.push(t.booleanLiteral(true));
    }

    const checkCall = t.expressionStatement(
      t.callExpression(t.identifier('useRenderCheck'), checkArgs)
    );
    bodyPath.unshiftContainer('body', checkCall);
  }

  // 3. Time tracker
  const timeCall = t.expressionStatement(
    t.callExpression(t.identifier('useRenderTimeTracker'), [t.stringLiteral(componentName)])
  );

  bodyPath.unshiftContainer('body', timeCall);
  bodyPath.unshiftContainer('body', trackerCall);
  return true;
}

function injectContextTracker(bodyPath, contextName, valueExpr, screenName) {
  const first = bodyPath.node.body[0];
  if (
    first &&
    t.isExpressionStatement(first) &&
    t.isCallExpression(first.expression) &&
    t.isIdentifier(first.expression.callee) &&
    first.expression.callee.name === 'useContextTracker' &&
    t.isStringLiteral(first.expression.arguments[0]) &&
    first.expression.arguments[0].value === contextName
  )
    return false;

  const args = [
    t.stringLiteral(contextName),
    valueExpr,
  ];
  if (screenName) {
    args.push(t.stringLiteral(screenName));
  }

  const trackerCall = t.expressionStatement(
    t.callExpression(t.identifier('useContextTracker'), args)
  );

  bodyPath.unshiftContainer('body', trackerCall);
  return true;
}

