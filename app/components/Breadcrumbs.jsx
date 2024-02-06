import { useMatches } from '@remix-run/react'
import React from 'react'

export const Breadcrumbs = () => {

const matches = useMatches()

console.log("Matches ",matches)

  return (
    <div>Breadcrumbs</div>
  )
}
