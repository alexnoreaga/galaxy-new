import React from 'react'

export const ParseSpesifikasi = ({jsonString}) => {
    const parseNode = (node) => {
        switch (node.type) {
          case 'root':
            return <div>{node.children.map(parseNode)}</div>;
          case 'heading':
            return React.createElement(`h${node.level}`, null, node.children.map(parseNode));
          case 'paragraph':
            return <p>{node.children.map(parseNode)}</p>;
          case 'text':
            return node.value;
          default:
            return null;
        }
      };
    
    const parsedData = JSON.parse(jsonString);

  return (
    
     <div>{parseNode(parsedData)}</div>
  )
}
