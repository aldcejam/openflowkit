import React, { Suspense, lazy } from 'react';

const LazyCodeHighlighter = lazy(async () => {
  const { Prism: SyntaxHighlighter } = await import('react-syntax-highlighter');
  const { oneDark } = await import('react-syntax-highlighter/dist/esm/styles/prism');

  function CodeHighlighter({ code, language }: { code: string; language: string }): React.ReactElement {
    return (
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '0.5rem 0.75rem',
          background: 'transparent',
          fontSize: '11px',
          lineHeight: 1.55,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Menlo', monospace",
        }}
      >
        {code}
      </SyntaxHighlighter>
    );
  }

  return { default: CodeHighlighter };
});

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps): React.ReactElement {
  return (
    <Suspense
      fallback={
        <pre
          style={{
            margin: 0,
            padding: '0.5rem 0.75rem',
            fontFamily: "'Fira Code', 'Menlo', monospace",
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            color: '#abb2bf',
            lineHeight: 1.55,
          }}
        >
          {code}
        </pre>
      }
    >
      <LazyCodeHighlighter code={code} language={language} />
    </Suspense>
  );
}
