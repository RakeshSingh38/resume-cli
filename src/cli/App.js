const React = require('react');
const { Text, Box } = require('ink');

function Lines({ text }) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  return React.createElement(React.Fragment, null,
    ...lines.map((l, i) => React.createElement(Text, { key: i }, l))
  );
}

function App({ header, content, tip }) {
  return React.createElement(
    Box,
    { flexDirection: 'column' },
    header ? React.createElement(Lines, { text: header }) : null,
    content ? React.createElement(Lines, { text: content }) : null,
    tip ? React.createElement(Lines, { text: tip }) : null
  );
}

module.exports = App;
