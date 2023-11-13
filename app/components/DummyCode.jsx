import React from 'react'

export const DummyCode = () => {
  return (
    <div>DummyCode</div>
  )
}




  const IMAGE_GALERY = `#graphql
  query metaobjects(first:2 type:"brands"){
      
      nodes {
        id
        
        updatedAt
        handle
        __typename
        fields {
          value
          key
          reference{
          ... on MediaImage {
              image {
                url
              }
            }
          }
          
        }
      }
    }
    `;