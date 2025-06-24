import * as monaco from "monaco-editor";

// Monaco Editor Configuration
export const configureMonaco = () => {
  // Configure Monaco Environment for Web Workers
  (window as any).MonacoEnvironment = {
    getWorker: function (_workerId: string, label: string) {
      switch (label) {
        case 'json':
        case 'css':
        case 'scss':
        case 'less':
        case 'html':
        case 'handlebars':
        case 'razor':
        case 'typescript':
        case 'javascript':
        default:
          // Return a mock worker that doesn't break functionality
          return {
            postMessage: () => {},
            terminate: () => {},
            addEventListener: () => {},
            removeEventListener: () => {}
          };
      }
    }
  };

  // Set the theme
  monaco.editor.defineTheme("rde-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6A9955" },
      { token: "keyword", foreground: "569CD6" },
      { token: "string", foreground: "CE9178" },
      { token: "number", foreground: "B5CEA8" },
      { token: "regexp", foreground: "D16969" },
      { token: "operator", foreground: "D4D4D4" },
      { token: "namespace", foreground: "4EC9B0" },
      { token: "type", foreground: "4EC9B0" },
      { token: "struct", foreground: "4EC9B0" },
      { token: "class", foreground: "4EC9B0" },
      { token: "interface", foreground: "B8D7A3" },
      { token: "parameter", foreground: "9CDCFE" },
      { token: "variable", foreground: "9CDCFE" },
      { token: "property", foreground: "9CDCFE" },
      { token: "enumMember", foreground: "4FC1FF" },
      { token: "function", foreground: "DCDCAA" },
      { token: "member", foreground: "DCDCAA" },
      { token: "macro", foreground: "4EC9B0" },
      { token: "tag", foreground: "569CD6" },
      { token: "attribute.name", foreground: "92C5F8" },
      { token: "attribute.value", foreground: "CE9178" },
    ],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.foreground": "#cccccc",
      "editor.lineHighlightBackground": "#2d2d30",
      "editor.selectionBackground": "#264F78",
      "editor.inactiveSelectionBackground": "#3A3D41",
      "editorLineNumber.foreground": "#858585",
      "editorLineNumber.activeForeground": "#c6c6c6",
      "editorCursor.foreground": "#aeafad",
      "editor.findMatchBackground": "#515c6a",
      "editor.findMatchHighlightBackground": "#ea5c004d",
      "editor.findRangeHighlightBackground": "#3a3d4166",
      "editorHoverWidget.background": "#252526",
      "editorHoverWidget.border": "#454545",
      "editorSuggestWidget.background": "#252526",
      "editorSuggestWidget.border": "#454545",
      "editorSuggestWidget.selectedBackground": "#094771",
      "editorWidget.background": "#252526",
      "editorWidget.border": "#454545",
      "input.background": "#3c3c3c",
      "input.border": "#3c3c3c",
      "inputOption.activeBorder": "#007acc",
      "scrollbar.shadow": "#000000",
      "scrollbarSlider.background": "#79797966",
      "scrollbarSlider.hoverBackground": "#646464b3",
      "scrollbarSlider.activeBackground": "#bfbfbf66",
      "progressBar.background": "#0e70c0",
    }
  });

  // Set default theme
  monaco.editor.setTheme("rde-dark");

  // Configure language features
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: "React",
    allowJs: true,
    typeRoots: ["node_modules/@types"],
  });

  // Add React types
  const reactTypes = `
    declare module 'react' {
      export = React;
      export as namespace React;
      namespace React {
        function Component<P = {}, S = {}>(props: P): JSX.Element;
        function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
        function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        function useMemo<T>(factory: () => T, deps: any[]): T;
        function useRef<T>(initialValue: T): { current: T };
        interface FC<P = {}> {
          (props: P): JSX.Element;
        }
      }
    }
  `;

  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    reactTypes,
    "file:///node_modules/@types/react/index.d.ts"
  );
};

export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'sql':
      return 'sql';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'plaintext';
  }
};
