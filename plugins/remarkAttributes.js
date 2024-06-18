// https://github.com/syntax-tree/mdast-util-to-hast?tab=readme-ov-file#fields-on-nodes

import { SKIP, visit } from "unist-util-visit"

const nodeTest = (node) => {
  return (
    node.type === "text" &&
    node.value.startsWith("{") &&
    node.value.includes("}")
  )
}

export default function remarkAttributes() {
  // This plugin handles non-standard markdown attributes
  // The best example is when we want to support CSS classes on images
  // The input markdown looks like this
  //
  // ![](myimg.png){.w-96}
  //
  // This input is parsed into mdast nodes like this
  // {
  //   type: 'paragraph',
  //   children: [
  //     {
  //       type: 'image',
  //       url: 'myimg.png',
  //       position: {...}
  //     },
  //     {
  //       type: 'text',
  //       value: '{.w-96}',
  //       position: {...}
  //     }
  //   ],
  //   position: {...}
  // },
  //
  // This plugin parses the attributes in the image's sibling node and assigns them as
  // hProperties of the image node, like this
  //
  //     {
  //       type: 'image',
  //       url: 'myimg.png',
  //       data: {hProperties: {className: ['.w96']}}
  //       position: {...}
  //     }
  //
  // remarkRehype will then apply the classNames to the html element

  return (tree) => {
    visit(tree, nodeTest, (node, index, parent) => {
      // Exit early if this node is not the next sibling of an image node
      if (index === 0) return

      // Get the previous sibling
      const prevSibling = parent.children[index - 1]

      // Exit early if the "{...}" isn't on the same line and immediately after the image/link/etc.
      if (
        prevSibling.position.end.line !== node.position.start.line ||
        prevSibling.position.end.column !== node.position.start.column
      ) {
        return
      }

      // Exit early if the previous sibling isn't an image or a link
      if (
        !["image", "imageReference", "link", "linkReference"].includes(
          prevSibling.type
        )
      )
        return

      // Get everything between the first set of braces {...}
      const value = node.value
      const innerValue = value.match(/^{(.*?)}/)[1]

      // Parse the properties
      const tokens = innerValue.split(" ").filter((x) => x !== "")
      if (tokens.length === 0) return

      // Apply them to the image node as hProperties
      const data = prevSibling.data || (prevSibling.data = {})
      const hProperties = data.hProperties || (data.hProperties = {})
      const className = hProperties.className || (hProperties.className = [])

      tokens.forEach((x) => {
        // We expect three forms of tokens:
        // .class     (e.g. .text-red-500)
        // key=value  (e.g. target="_blank")
        // key        (e.g. autoplay)

        if (/^\.[\w\.\/-]+/.test(x)) {
          className.push(x.substring(1))
        } else if (/^[^=]+=[^=]+$/.test(x)) {
          const { key, val } =
            /^(?<key>[^=]+)=(?:['"]+)?(?<val>[^=]+?)(?:['"]+)?$/.exec(x).groups
          hProperties[key] = val
        } else {
          hProperties[x] = true
        }
      })

      if (hProperties.className.length === 0) delete hProperties["className"]

      // Update this node's value by chopping off the "{...}" bit
      node.value = node.value.slice(innerValue.length + 2)

      // If the remaining string is empty, delete this node
      if (node.value === "") {
        parent.children.splice(index, 1)
        return [SKIP, index]
      }
    })
  }
}
