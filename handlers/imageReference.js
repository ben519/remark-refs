// This function is essentially a copy of
// https://github.com/syntax-tree/mdast-util-to-hast/blob/main/lib/handlers/image-reference.js
// ...but it has a small tweak at the end to include more data from the definition node
// The purpose of this is to support reference-style video links
// https://github.com/remarkjs/remark-rehype/issues/37

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').ImageReference} ImageReference
 * @typedef {import('../state.js').State} State
 */

import { normalizeUri } from "micromark-util-sanitize-uri"

/**
 * Turn an mdast `imageReference` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {ImageReference} node
 *   mdast node.
 * @returns {Array<ElementContent> | ElementContent}
 *   hast node.
 */
export function imageReference(state, node) {
  const id = String(node.identifier).toUpperCase()
  const def = state.definitionById.get(id)

  if (!def) {
    return revert(state, node)
  }

  /** @type {Properties} */
  const properties = { src: normalizeUri(def.url || ""), alt: node.alt }

  if (def.title !== null && def.title !== undefined) {
    properties.title = def.title
  }

  /** @type {Element} */
  const result = { type: "element", tagName: "img", properties, children: [] }
  state.patch(node, result)

  // Apply data, first from node and then from def
  // This is the only difference from the original version of this function
  // https://github.com/syntax-tree/mdast-util-to-hast/blob/main/lib/handlers/image-reference.js
  return state.applyData(def, state.applyData(node, result))
}

function revert(state, node) {
  const subtype = node.referenceType
  let suffix = "]"

  if (subtype === "collapsed") {
    suffix += "[]"
  } else if (subtype === "full") {
    suffix += "[" + (node.label || node.identifier) + "]"
  }

  if (node.type === "imageReference") {
    return [{ type: "text", value: "![" + node.alt + suffix }]
  }

  const contents = state.all(node)
  const head = contents[0]

  if (head && head.type === "text") {
    head.value = "[" + head.value
  } else {
    contents.unshift({ type: "text", value: "[" })
  }

  const tail = contents[contents.length - 1]

  if (tail && tail.type === "text") {
    tail.value += suffix
  } else {
    contents.push({ type: "text", value: suffix })
  }

  return contents
}
