const babel = require('@babel/core');
const plugin = require('../src/index');

function transform(code) {
  return babel.transform(code, {
    plugins: [plugin],
    filename: 'test.js',
    presets: ['@babel/preset-react'],
  }).code;
}

describe('@rn-debug-mcp/babel-plugin', () => {
  it('should instrument functional components', () => {
    const input = `
      function MyComponent(props) {
        return <View><Text>Hello</Text></View>;
      }
    `;
    const output = transform(input);
    expect(output).toContain('useRenderTracker("MyComponent", "test")');
    expect(output).toContain('useRenderCheck("MyComponent", props, "test")');
    expect(output).toContain('require("@rn-debug-mcp/instrumentation")');
  });

  it('should instrument arrow function components', () => {
    const input = `
      const MyComponent = (props) => {
        return <View><Text>Hello</Text></View>;
      };
    `;
    const output = transform(input);
    expect(output).toContain('useRenderTracker("MyComponent", "test")');
    expect(output).toContain('useRenderCheck("MyComponent", props, "test")');
  });

  it('should instrument memoized components', () => {
    const input = `
      const MyComponent = React.memo((props) => {
        return <View><Text>Hello</Text></View>;
      });
    `;
    const output = transform(input);
    expect(output).toContain('useRenderTracker("MyComponent", "test")');
    expect(output).toContain('useRenderCheck("MyComponent", props, "test", true)');
  });

  it('should skip node_modules', () => {
    const input = `function Component() { return null; }`;
    const output = babel.transform(input, {
      plugins: [plugin],
      filename: 'node_modules/some-lib/index.js',
    }).code;
    expect(output).not.toContain('useRenderTracker');
  });
});
