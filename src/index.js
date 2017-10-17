// @flow

import { Children } from 'react'
import invariant from 'invariant'

type MINMAX<MIN, MAX> = {
  min: MIN,
  max?: MAX
}

export const OPTIONAL: MINMAX<number, number> = {
  min: 0,
  max: 1
}

export const OPTIONALS: MINMAX<number, null> = {
  min: 0
}

export const REQUIRED: MINMAX<number, number> = {
  min: 1,
  max: 1
}

export const REQUIREDS : MINMAX<number, null> = {
  min: 1
}

const REST: string = 'rest'

/**
 *
 *  Utility for generalized composition of React components.
 *
 * @param {React.Children} children
 * @param {Object} schema Hash containing `seapig` schema options
 *
 * @example <caption>Example usage of 🌊🐷</caption>
 *
 * const {
 *  iconChildren, //array of icon elements
 *  rest          // array of all other children
 * } = seapig(children, {
 *  icon: {
 *    min: 1,
 *    max: 1
 *  }
 * })
 *
 * @returns {Object} Object hash where each key is one of the given props concatenated with 'Children' and each value is a react component matching that prop.
 */

export default function seapig (children: Array<{}>, schema: {} = {}) : {} {
  invariant(schema && typeof schema === 'object', 'schema must be an object')

  // extract schema and initialize the result
  const propNames: Array<string> = Object.keys(schema)
  const result: {[string]: Array<{}>} = propNames.reduce(
    (r, propName) => {
      r[convertPropName(propName)] = []
      return r
    },
    {
      [REST]: []
    }
  )

  // build the result
  Children.toArray(children).forEach(child => {
    if (!child) {
      return
    }
    const propName: string = propNames.find(p => child.props[p]) || REST
    result[propName === REST ? propName : convertPropName(propName)].push(child)
  })

  // validate the result
  propNames.forEach(propName => {
    assertSchemaProp('min', propName, result, schema)
    assertSchemaProp('max', propName, result, schema)
  })

  return result
}

function convertPropName (propName: string) : string {
  return `${propName}Children`
}

// define as an object, look into sealed and unsealed
const defaultSchema: MINMAX<number, number> = {
  min: 0,
  max: Infinity
}


function isValidNum (num: ?number) : boolean {
  return typeof num === 'number' && !isNaN(num)
}

type VALIDFUNC = (number, number) => boolean;

const validations: MINMAX<VALIDFUNC, VALIDFUNC> = {
  min: (count: number, min: number): boolean => count >= min,
  max: (count: number, max: number): boolean => count <= max
}

function assertSchemaProp (numProp: string, schemaProp: string, result: {}, schema: {}) {
  const elementsCount: number = result[convertPropName(schemaProp)].length
  const propSchema: {[string]: number} = schema[schemaProp]
  const limit: number = isValidNum(propSchema[numProp])
    ? propSchema[numProp]
    : defaultSchema[numProp]
  const invariantMessageEnding: string = `${limit} \`${schemaProp}\` element${limit !== 1 ? 's' : ''}`
  invariant(
    validations[numProp](elementsCount, limit),
    numProp === 'min'
      ? `Must have at least ${invariantMessageEnding}`
      : `Cannot have more than ${invariantMessageEnding}`
  )
}
