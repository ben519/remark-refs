import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"
import { imageReference } from "./handlers/imageReference.js"
import remarkAttributes from "./plugins/remarkAttributes.js"
import remarkFiles from "./plugins/remarkFiles.js"
// import printTree from "./printTree.js"

const authorId = "XYZ"
const filesMap = {
  "foo.mp4": "http://127.0.0.1:9199/foo.mp4",
  "test.png": "http://127.0.0.1:9199/test.png",
}

const inputMarkdown = `
![][dog]{ height=100 }

[dog]: foo.mp4
`

// Build processor with the imageReference handler
let processorWithHandler = unified()
  .use(remarkParse)
  .use(remarkAttributes)
  .use(remarkFiles, { authorId, filesMap })
  .use(remarkRehype, { handlers: { imageReference } })
  .use(rehypeStringify)

// Build processor without the imageReference handler
let processorWithoutHandler = unified()
  .use(remarkParse)
  .use(remarkAttributes)
  .use(remarkFiles, { authorId, filesMap })
  .use(remarkRehype)
  .use(rehypeStringify)

// Compare with & without the imageReference handler
const withHandler = await processorWithHandler.process(inputMarkdown)
console.log(withHandler) // <p><video src="http://127.0.0.1:9199/foo.mp4" alt="" height="100" controls></video></p>

const withoutHandler = await processorWithoutHandler.process(inputMarkdown)
console.log(withoutHandler) // <p><img src="http://127.0.0.1:9199/foo.mp4" alt="" height="100"></p>
