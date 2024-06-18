import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import remarkAttributes from "./plugins/remarkAttributes.js"
import remarkFiles from "./plugins/remarkFiles.js"
// import printTree from "./printTree.js"

const authorId = "XYZ"
const filesMap = {
  "MyImage.png": "http://127.0.0.1:9199/MyImage.png",
  "test.png": "http://127.0.0.1:9199/test.png",
}

// Build processor
let processor = unified()
  .use(remarkParse)
  .use(remarkAttributes)
  .use(remarkFiles, { authorId, filesMap })
  .use(remarkRehype)
  .use(rehypeStringify)

const text = `
![][dog]{ height=100 }

[dog]: foo.mp4
`

const processed = await processor.process(text)
console.log(processed)
